export interface Location {
  id: string;
  address: string;
  lat: number;
  lng: number;
}

export interface OptimizedRoute {
  locations: Location[];
  total_distance: number;
  total_time: number;
  route_order: number[];
}

export interface RouteRequest {
  locations: Array<{
    address?: string;
    lat?: number;
    lng?: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}