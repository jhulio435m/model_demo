import axios, { AxiosError } from 'axios';
import { RouteRequest, OptimizedRoute, ApiResponse } from '../types';
import { RouteOptimizerError } from '../utils/errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout for complex calculations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Response Error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      throw new RouteOptimizerError(
        'NETWORK_ERROR',
        'Backend server is not running',
        'Please start the Python server: cd backend && python main.py'
      );
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new RouteOptimizerError(
        'TIMEOUT_ERROR',
        'Request timed out',
        'Try reducing the number of locations or check your connection'
      );
    }
    
    if (error.response?.status === 400) {
      throw new RouteOptimizerError(
        'VALIDATION_ERROR',
        error.response.data?.error || 'Invalid request data',
        'Please check your input and try again'
      );
    }
    
    if (error.response?.status === 500) {
      throw new RouteOptimizerError(
        'SERVER_ERROR',
        'Internal server error',
        'Please try again later or contact support'
      );
    }
    
    throw new RouteOptimizerError(
      'UNKNOWN_ERROR',
      error.message || 'An unexpected error occurred'
    );
  }
);

export const routeService = {
  async optimizeRoute(request: RouteRequest): Promise<OptimizedRoute> {
    try {
      // Validate request before sending
      if (!request.locations || request.locations.length < 2) {
        throw new RouteOptimizerError(
          'VALIDATION_ERROR',
          'At least 2 locations are required'
        );
      }

      if (request.locations.length > 25) {
        throw new RouteOptimizerError(
          'VALIDATION_ERROR',
          'Maximum 25 locations allowed for optimal performance'
        );
      }

      const response = await api.post<ApiResponse<OptimizedRoute>>('/optimize-route', request);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new RouteOptimizerError(
          'OPTIMIZATION_ERROR',
          response.data.error || 'Failed to optimize route'
        );
      }
    } catch (error) {
      if (error instanceof RouteOptimizerError) {
        throw error;
      }
      throw new RouteOptimizerError(
        'OPTIMIZATION_ERROR',
        'Failed to optimize route',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  },

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      if (!address.trim()) {
        throw new RouteOptimizerError(
          'VALIDATION_ERROR',
          'Address cannot be empty'
        );
      }

      const response = await api.post<ApiResponse<{ lat: number; lng: number }>>('/geocode', {
        address: address.trim(),
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new RouteOptimizerError(
          'GEOCODING_ERROR',
          response.data.error || 'Failed to geocode address'
        );
      }
    } catch (error) {
      if (error instanceof RouteOptimizerError) {
        throw error;
      }
      throw new RouteOptimizerError(
        'GEOCODING_ERROR',
        'Failed to find location',
        'Please check the address format and try again'
      );
    }
  },

  async getOptimizationStrategies(): Promise<any> {
    try {
      const response = await api.get<ApiResponse<any>>('/optimization-strategies');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new RouteOptimizerError(
          'API_ERROR',
          'Failed to get optimization strategies'
        );
      }
    } catch (error) {
      if (error instanceof RouteOptimizerError) {
        throw error;
      }
      throw new RouteOptimizerError(
        'API_ERROR',
        'Failed to get optimization strategies'
      );
    }
  },

  async getVehicleTypes(): Promise<any> {
    try {
      const response = await api.get<ApiResponse<any>>('/vehicle-types');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new RouteOptimizerError(
          'API_ERROR',
          'Failed to get vehicle types'
        );
      }
    } catch (error) {
      if (error instanceof RouteOptimizerError) {
        throw error;
      }
      throw new RouteOptimizerError(
        'API_ERROR',
        'Failed to get vehicle types'
      );
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },
};