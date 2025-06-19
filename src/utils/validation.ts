export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const validateAddress = (address: string): boolean => {
  return address.trim().length >= 3;
};

export const validateUTM = (easting: number, northing: number, zoneNumber: number, zoneLetter: string): boolean => {
  return (
    easting >= 100000 && easting <= 900000 &&
    northing >= 0 && northing <= 10000000 &&
    zoneNumber >= 1 && zoneNumber <= 60 &&
    /^[C-X]$/i.test(zoneLetter)
  );
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }
  return `${(distance / 1000).toFixed(2)} km`;
};

export const formatTime = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};