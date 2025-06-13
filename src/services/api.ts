import axios from 'axios';
import { RouteRequest, OptimizedRoute, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const routeService = {
  async optimizeRoute(request: RouteRequest): Promise<OptimizedRoute> {
    try {
      const response = await api.post<ApiResponse<OptimizedRoute>>('/optimize-route', request);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to optimize route');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Backend server is not running. Please start the Python server on port 8000.');
        }
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await api.post<ApiResponse<{ lat: number; lng: number }>>('/geocode', {
        address,
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to geocode address');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  },
};
