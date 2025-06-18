export interface Location {
  id: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  priority?: number;
  timeWindow?: {
    start: string;
    end: string;
  };
  serviceTime?: number; // minutes
}

export interface OptimizedRoute {
  locations: Location[];
  total_distance: number;
  total_time: number;
  route_order: number[];
  segments?: RouteSegment[];
  optimization_stats?: OptimizationStats;
}

export interface RouteSegment {
  from_location: Location;
  to_location: Location;
  distance: number;
  time: number;
  instructions?: string[];
}

export interface OptimizationStats {
  algorithm_used: string;
  computation_time: number;
  iterations: number;
  improvement_percentage: number;
}

export interface RouteRequest {
  locations: Array<{
    address?: string;
    lat?: number;
    lng?: number;
    category?: string;
    priority?: number;
    timeWindow?: {
      start: string;
      end: string;
    };
    serviceTime?: number;
  }>;
  optimization_type?: 'distance' | 'time' | 'balanced';
  vehicle_type?: 'car' | 'truck' | 'bike' | 'walking';
  start_location?: number; // index of starting location
  return_to_start?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SavedRoute {
  id: string;
  name: string;
  description?: string;
  route: OptimizedRoute;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface RouteComparison {
  routes: OptimizedRoute[];
  comparison_metrics: {
    distance_savings: number;
    time_savings: number;
    efficiency_score: number;
  };
}

export interface TrafficData {
  segment_id: string;
  traffic_level: 'low' | 'medium' | 'high' | 'severe';
  delay_minutes: number;
  updated_at: string;
}

export interface WeatherData {
  location: {
    lat: number;
    lng: number;
  };
  current: {
    temperature: number;
    condition: string;
    visibility: number;
    wind_speed: number;
  };
  forecast: Array<{
    time: string;
    condition: string;
    precipitation_chance: number;
  }>;
}
