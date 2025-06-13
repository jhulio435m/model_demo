from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Route Optimizer API",
    description="API for optimizing routes between multiple locations",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize geocoder
geolocator = Nominatim(user_agent="route_optimizer_app")

# Pydantic models
class LocationInput(BaseModel):
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class RouteRequest(BaseModel):
    locations: List[LocationInput]

class Location(BaseModel):
    id: str
    address: str
    lat: float
    lng: float

class OptimizedRoute(BaseModel):
    locations: List[Location]
    total_distance: float
    total_time: float
    route_order: List[int]

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None

class GeocodeRequest(BaseModel):
    address: str

class GeocodeResponse(BaseModel):
    lat: float
    lng: float

def geocode_address(address: str) -> tuple[float, float]:
    """Geocode an address to coordinates"""
    try:
        location = geolocator.geocode(address, timeout=10)
        if location:
            return location.latitude, location.longitude
        else:
            raise ValueError(f"Could not geocode address: {address}")
    except Exception as e:
        logger.error(f"Geocoding error for '{address}': {str(e)}")
        raise ValueError(f"Geocoding failed for '{address}': {str(e)}")

def calculate_distance_matrix(locations: List[tuple[float, float]]) -> List[List[float]]:
    """Calculate distance matrix between all locations"""
    n = len(locations)
    matrix = [[0.0 for _ in range(n)] for _ in range(n)]
    
    for i in range(n):
        for j in range(n):
            if i != j:
                distance = geodesic(locations[i], locations[j]).meters
                matrix[i][j] = distance
            else:
                matrix[i][j] = 0.0
    
    return matrix

def solve_tsp(distance_matrix: List[List[float]]) -> tuple[List[int], float]:
    """Solve TSP using OR-Tools"""
    try:
        # Create the routing index manager
        manager = pywrapcp.RoutingIndexManager(
            len(distance_matrix), 1, 0  # num_locations, num_vehicles, depot
        )
        
        # Create routing model
        routing = pywrapcp.RoutingModel(manager)
        
        def distance_callback(from_index, to_index):
            """Returns the distance between the two nodes."""
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(distance_matrix[from_node][to_node])
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Setting first solution heuristic
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(30)
        
        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            # Extract the route
            route = []
            total_distance = 0
            index = routing.Start(0)
            
            while not routing.IsEnd(index):
                route.append(manager.IndexToNode(index))
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                total_distance += distance_matrix[manager.IndexToNode(previous_index)][manager.IndexToNode(index)]
            
            return route, total_distance
        else:
            raise ValueError("No solution found for TSP")
            
    except Exception as e:
        logger.error(f"TSP solving error: {str(e)}")
        raise ValueError(f"Failed to solve route optimization: {str(e)}")

def estimate_travel_time(distance_meters: float) -> float:
    """Estimate travel time based on distance (assuming average speed of 50 km/h)"""
    # Convert meters to km and calculate time in hours, then convert to seconds
    distance_km = distance_meters / 1000
    average_speed_kmh = 50
    time_hours = distance_km / average_speed_kmh
    return time_hours * 3600  # Convert to seconds

@app.get("/")
async def root():
    return {"message": "Route Optimizer API is running"}

@app.get("/health")
async def health_check():
    return ApiResponse(success=True, data={"status": "healthy", "timestamp": time.time()})

@app.post("/geocode", response_model=ApiResponse)
async def geocode_endpoint(request: GeocodeRequest):
    """Geocode a single address"""
    try:
        lat, lng = geocode_address(request.address)
        return ApiResponse(
            success=True,
            data=GeocodeResponse(lat=lat, lng=lng)
        )
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        return ApiResponse(
            success=False,
            error=str(e)
        )

@app.post("/optimize-route", response_model=ApiResponse)
async def optimize_route(request: RouteRequest):
    """Optimize route for multiple locations"""
    try:
        if len(request.locations) < 2:
            raise HTTPException(status_code=400, detail="At least 2 locations are required")
        
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
                    lng=lng
                )
                processed_locations.append(location)
                coordinates.append((lat, lng))
                
            except Exception as e:
                logger.error(f"Error processing location {i}: {str(e)}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error processing location {i + 1}: {str(e)}"
                )
        
        # Calculate distance matrix
        logger.info(f"Calculating distance matrix for {len(coordinates)} locations")
        distance_matrix = calculate_distance_matrix(coordinates)
        
        # Solve TSP
        logger.info("Solving TSP optimization")
        route_order, total_distance = solve_tsp(distance_matrix)
        
        # Estimate total travel time
        total_time = estimate_travel_time(total_distance)
        
        # Create optimized route response
        optimized_route = OptimizedRoute(
            locations=processed_locations,
            total_distance=total_distance,
            total_time=total_time,
            route_order=route_order
        )
        
        logger.info(f"Route optimization completed: {len(route_order)} stops, {total_distance:.2f}m total distance")
        
        return ApiResponse(success=True, data=optimized_route)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Route optimization error: {str(e)}")
        return ApiResponse(
            success=False,
            error=f"Route optimization failed: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )