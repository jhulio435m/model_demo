from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from geopy.geocoders import Nominatim, ArcGIS
from geopy.distance import geodesic
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import time
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Advanced Route Optimizer API",
    description="API for optimizing routes between multiple locations with advanced features",
    version="2.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize geocoders
geolocator_osm = Nominatim(user_agent="advanced_route_optimizer_app")
geolocator_arcgis = ArcGIS(timeout=10)


# Enhanced Pydantic models
class TimeWindow(BaseModel):
    start: str
    end: str


class LocationInput(BaseModel):
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    category: Optional[str] = None
    priority: Optional[int] = 1
    timeWindow: Optional[TimeWindow] = None
    serviceTime: Optional[int] = 0  # minutes


class RouteRequest(BaseModel):
    locations: List[LocationInput]
    optimization_type: Optional[str] = "distance"  # distance, time, balanced
    vehicle_type: Optional[str] = "car"  # car, truck, bike, walking
    start_location: Optional[int] = None
    return_to_start: Optional[bool] = False


class Location(BaseModel):
    id: str
    address: str
    lat: float
    lng: float
    category: Optional[str] = None
    priority: Optional[int] = 1
    timeWindow: Optional[TimeWindow] = None
    serviceTime: Optional[int] = 0


class RouteSegment(BaseModel):
    from_location: Location
    to_location: Location
    distance: float
    time: float
    instructions: Optional[List[str]] = None


class OptimizationStats(BaseModel):
    algorithm_used: str
    computation_time: float
    iterations: int
    improvement_percentage: float


class OptimizedRoute(BaseModel):
    locations: List[Location]
    total_distance: float
    total_time: float
    route_order: List[int]
    segments: Optional[List[RouteSegment]] = None
    optimization_stats: Optional[OptimizationStats] = None


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


class GeocodeRequest(BaseModel):
    address: str


class GeocodeResponse(BaseModel):
    lat: float
    lng: float


class OptimizeRequest(BaseModel):
    """Simple optimization request with coordinates only."""

    locations: List[tuple[float, float]]
    return_to_start: bool = False


class OptimizeResponse(BaseModel):
    """Response model for the `/optimize` endpoint."""

    order: List[int]
    total_distance: float


def geocode_address(address: str) -> tuple[float, float]:
    """Geocode an address to coordinates using multiple providers."""
    try:
        # First attempt with OpenStreetMap's Nominatim
        location = geolocator_osm.geocode(address, timeout=10)
        if not location:
            # Fallback to ArcGIS when Nominatim fails
            location = geolocator_arcgis.geocode(address)

        if location:
            return location.latitude, location.longitude
        else:
            raise ValueError(f"Could not geocode address: {address}")
    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {str(e)}")
        raise ValueError(f"Geocoding failed for '{address}': {str(e)}")


def calculate_distance_matrix(
    locations: List[tuple[float, float]], vehicle_type: str = "car"
) -> List[List[float]]:
    """Calculate distance matrix between all locations with vehicle-specific adjustments"""
    n = len(locations)
    matrix = [[0.0 for _ in range(n)] for _ in range(n)]

    # Vehicle-specific speed factors
    speed_factors = {
        "car": 1.0,
        "truck": 0.8,  # Slower due to size and restrictions
        "bike": 0.3,  # Much slower
        "walking": 0.1,  # Slowest
    }

    speed_factor = speed_factors.get(vehicle_type, 1.0)

    for i in range(n):
        for j in range(n):
            if i != j:
                distance = geodesic(locations[i], locations[j]).meters
                # Apply vehicle-specific adjustments
                if vehicle_type == "truck":
                    distance *= 1.1  # Longer routes due to restrictions
                elif vehicle_type == "bike":
                    distance *= 0.9  # Can take shortcuts
                elif vehicle_type == "walking":
                    distance *= 0.8  # Can use pedestrian paths

                matrix[i][j] = distance
            else:
                matrix[i][j] = 0.0

    return matrix


def solve_tsp_advanced(
    distance_matrix: List[List[float]],
    optimization_type: str = "distance",
    start_location: Optional[int] = None,
    return_to_start: bool = False,
    time_limit: int = 30,
) -> tuple[List[int], float, OptimizationStats]:
    """Advanced TSP solver with multiple optimization strategies"""
    start_time = time.time()

    try:
        num_locations = len(distance_matrix)
        num_vehicles = 1
        depot = start_location if start_location is not None else 0

        # Create the routing index manager
        manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, depot)

        # Create routing model
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index, to_index):
            """Returns the distance between the two nodes."""
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            base_distance = distance_matrix[from_node][to_node]

            # Apply optimization type adjustments
            if optimization_type == "time":
                # Prioritize time over distance
                return int(base_distance * 1.2)
            elif optimization_type == "balanced":
                # Balance between distance and time
                return int(base_distance * 1.1)
            else:
                # Pure distance optimization
                return int(base_distance)

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Setting search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()

        # Choose strategy based on optimization type
        if optimization_type == "time":
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_MOST_CONSTRAINED_ARC
            )
        else:
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )

        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(time_limit)

        # Add return to start constraint if needed
        if return_to_start:
            routing.AddConstantDimension(1, 0, num_locations, True, "count")

        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            # Extract the route
            route = []
            total_distance = 0
            index = routing.Start(0)
            iterations = 0

            while not routing.IsEnd(index):
                route.append(manager.IndexToNode(index))
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                if not routing.IsEnd(index):
                    total_distance += distance_matrix[
                        manager.IndexToNode(previous_index)
                    ][manager.IndexToNode(index)]
                iterations += 1

            # Add final segment if returning to start
            if return_to_start and len(route) > 1:
                total_distance += distance_matrix[route[-1]][route[0]]
                route.append(route[0])

            computation_time = time.time() - start_time

            # Calculate improvement percentage (simulated)
            naive_distance = sum(
                distance_matrix[i][(i + 1) % len(distance_matrix)]
                for i in range(len(distance_matrix))
            )
            improvement = max(
                0, (naive_distance - total_distance) / naive_distance * 100
            )

            stats = OptimizationStats(
                algorithm_used=f"OR-Tools TSP ({optimization_type})",
                computation_time=computation_time,
                iterations=iterations,
                improvement_percentage=improvement,
            )

            return route, total_distance, stats
        else:
            raise ValueError("No solution found for TSP")

    except Exception as e:
        logger.error(f"Advanced TSP solving error: {str(e)}")
        raise ValueError(f"Failed to solve route optimization: {str(e)}")


def estimate_travel_time(distance_meters: float, vehicle_type: str = "car") -> float:
    """Estimate travel time based on distance and vehicle type"""
    # Average speeds in km/h
    speeds = {"car": 50, "truck": 40, "bike": 15, "walking": 5}

    speed_kmh = speeds.get(vehicle_type, 50)
    distance_km = distance_meters / 1000
    time_hours = distance_km / speed_kmh
    return time_hours * 3600  # Convert to seconds


def create_route_segments(
    locations: List[Location],
    route_order: List[int],
    distance_matrix: List[List[float]],
    vehicle_type: str,
) -> List[RouteSegment]:
    """Create detailed route segments with instructions"""
    segments = []

    for i in range(len(route_order) - 1):
        from_idx = route_order[i]
        to_idx = route_order[i + 1]

        from_location = locations[from_idx]
        to_location = locations[to_idx]

        distance = distance_matrix[from_idx][to_idx]
        time = estimate_travel_time(distance, vehicle_type)

        # Generate basic instructions
        instructions = [
            f"Head from {from_location.address}",
            f"Travel {distance/1000:.1f} km",
            f"Arrive at {to_location.address}",
        ]

        segment = RouteSegment(
            from_location=from_location,
            to_location=to_location,
            distance=distance,
            time=time,
            instructions=instructions,
        )

        segments.append(segment)

    return segments


@app.get("/")
async def root():
    return {"message": "Advanced Route Optimizer API is running", "version": "2.0.0"}


@app.get("/health")
async def health_check():
    return ApiResponse(
        success=True, data={"status": "healthy", "timestamp": time.time()}
    )


@app.post("/geocode", response_model=ApiResponse)
async def geocode_endpoint(request: GeocodeRequest):
    """Geocode a single address"""
    try:
        lat, lng = geocode_address(request.address)
        return ApiResponse(success=True, data=GeocodeResponse(lat=lat, lng=lng))
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return ApiResponse(success=False, error=str(e))


@app.post("/optimize", response_model=OptimizeResponse)
async def optimize_simple(request: OptimizeRequest):
    """Optimize a simple list of coordinates."""
    try:
        if len(request.locations) < 2:
            raise HTTPException(
                status_code=400, detail="At least 2 locations are required"
            )

        distance_matrix = calculate_distance_matrix(request.locations, "car")
        route_order, total_distance, _ = solve_tsp_advanced(
            distance_matrix,
            optimization_type="distance",
            start_location=0,
            return_to_start=request.return_to_start,
        )

        return OptimizeResponse(order=route_order, total_distance=total_distance)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simple optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize-route", response_model=ApiResponse)
async def optimize_route(request: RouteRequest):
    """Advanced route optimization with multiple strategies"""
    try:
        if len(request.locations) < 2:
            raise HTTPException(
                status_code=400, detail="At least 2 locations are required"
            )

        # Process locations and geocode if necessary
        processed_locations = []
        coordinates = []

        for i, loc_input in enumerate(request.locations):
            try:
                if loc_input.lat is not None and loc_input.lng is not None:
                    # Use provided coordinates
                    lat, lng = loc_input.lat, loc_input.lng
                    address = loc_input.address or f"{lat}, {lng}"
                elif loc_input.address:
                    # Geocode the address
                    lat, lng = geocode_address(loc_input.address)
                    address = loc_input.address
                else:
                    raise ValueError("Either address or coordinates must be provided")

                location = Location(
                    id=f"loc_{i}",
                    address=address,
                    lat=lat,
                    lng=lng,
                    category=loc_input.category,
                    priority=loc_input.priority or 1,
                    timeWindow=loc_input.timeWindow,
                    serviceTime=loc_input.serviceTime or 0,
                )
                processed_locations.append(location)
                coordinates.append((lat, lng))

            except Exception as e:
                logger.error(f"Error processing location {i}: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Error processing location {i + 1}: {str(e)}",
                )

        # Calculate distance matrix with vehicle-specific adjustments
        logger.info(f"Calculating distance matrix for {len(coordinates)} locations")
        distance_matrix = calculate_distance_matrix(
            coordinates, request.vehicle_type or "car"
        )

        # Solve TSP with advanced options
        logger.info(f"Solving TSP optimization (type: {request.optimization_type})")
        route_order, total_distance, optimization_stats = solve_tsp_advanced(
            distance_matrix,
            optimization_type=request.optimization_type or "distance",
            start_location=request.start_location,
            return_to_start=request.return_to_start or False,
        )

        # Estimate total travel time
        total_time = estimate_travel_time(total_distance, request.vehicle_type or "car")

        # Create route segments
        segments = create_route_segments(
            processed_locations,
            route_order,
            distance_matrix,
            request.vehicle_type or "car",
        )

        # Create optimized route response
        optimized_route = OptimizedRoute(
            locations=processed_locations,
            total_distance=total_distance,
            total_time=total_time,
            route_order=route_order,
            segments=segments,
            optimization_stats=optimization_stats,
        )

        logger.info(
            f"Route optimization completed: {len(route_order)} stops, {total_distance:.2f}m total distance"
        )

        return ApiResponse(success=True, data=optimized_route)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Route optimization error: {str(e)}")
        return ApiResponse(success=False, error=f"Route optimization failed: {str(e)}")


@app.get("/optimization-strategies")
async def get_optimization_strategies():
    """Get available optimization strategies"""
    strategies = {
        "distance": {
            "name": "Shortest Distance",
            "description": "Minimize total travel distance",
            "best_for": "Fuel efficiency, cost reduction",
        },
        "time": {
            "name": "Fastest Time",
            "description": "Minimize total travel time",
            "best_for": "Time-sensitive deliveries, urgent routes",
        },
        "balanced": {
            "name": "Balanced Optimization",
            "description": "Balance between distance and time",
            "best_for": "General purpose routing",
        },
    }

    return ApiResponse(success=True, data=strategies)


@app.get("/vehicle-types")
async def get_vehicle_types():
    """Get available vehicle types and their characteristics"""
    vehicles = {
        "car": {
            "name": "Car",
            "avg_speed": 50,
            "restrictions": "Standard road access",
            "fuel_efficiency": "Good",
        },
        "truck": {
            "name": "Truck",
            "avg_speed": 40,
            "restrictions": "Height/weight restrictions, limited urban access",
            "fuel_efficiency": "Lower",
        },
        "bike": {
            "name": "Bicycle",
            "avg_speed": 15,
            "restrictions": "Bike lanes preferred, weather dependent",
            "fuel_efficiency": "Excellent (no fuel)",
        },
        "walking": {
            "name": "Walking",
            "avg_speed": 5,
            "restrictions": "Pedestrian areas only",
            "fuel_efficiency": "Excellent (no fuel)",
        },
    }

    return ApiResponse(success=True, data=vehicles)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
