import toast from 'react-hot-toast';
import { AppError } from '../types';

export class RouteOptimizerError extends Error {
  code: string;
  details?: string;

  constructor(code: string, message: string, details?: string) {
    super(message);
    this.name = 'RouteOptimizerError';
    this.code = code;
    this.details = details;
  }
}

export const handleError = (error: unknown): AppError => {
  console.error('Application error:', error);

  if (error instanceof RouteOptimizerError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Network Error')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Backend server is not running. Please start the Python server on port 8000.',
        details: 'Make sure to run: cd backend && python main.py',
      };
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again with fewer locations.',
        details: 'Consider reducing the number of locations or checking your internet connection.',
      };
    }

    // Geocoding errors
    if (error.message.includes('geocode') || error.message.includes('address')) {
      return {
        code: 'GEOCODING_ERROR',
        message: 'Failed to find location. Please check the address format.',
        details: 'Try using a more specific address or coordinates instead.',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
};

export const showErrorToast = (error: AppError) => {
  toast.error(error.message, {
    duration: 5000,
    style: {
      maxWidth: '500px',
    },
  });
};

export const validateLocation = (location: Partial<Location>): string[] => {
  const errors: string[] = [];

  if (!location.address && (!location.lat || !location.lng)) {
    errors.push('Either address or coordinates must be provided');
  }

  if (location.lat !== undefined && (location.lat < -90 || location.lat > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (location.lng !== undefined && (location.lng < -180 || location.lng > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  if (location.priority !== undefined && (location.priority < 1 || location.priority > 10)) {
    errors.push('Priority must be between 1 and 10');
  }

  return errors;
};

export const validateRouteRequest = (request: Partial<any>): string[] => {
  const errors: string[] = [];

  if (!request.locations || request.locations.length < 2) {
    errors.push('At least 2 locations are required');
  }

  if (request.locations && request.locations.length > 25) {
    errors.push('Maximum 25 locations allowed for optimal performance');
  }

  return errors;
};