import React, { useState } from 'react';
import { MapPin, Calculator, AlertCircle } from 'lucide-react';
import { LocationInput } from './components/LocationInput';
import { RouteMap } from './components/RouteMap';
import { RouteResults } from './components/RouteResults';
import { routeService } from './services/api';
import { Location, OptimizedRoute } from './types';

function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddLocation = (locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...locationData,
      id: generateId(),
    };
    setLocations(prev => [...prev, newLocation]);
    setError(null);
  };

  const handleRemoveLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
    // Clear route if we remove locations
    if (optimizedRoute) {
      setOptimizedRoute(null);
    }
  };

  const handleClearAll = () => {
    setLocations([]);
    setOptimizedRoute(null);
    setError(null);
  };

  const handleCalculateRoute = async () => {
    if (locations.length < 2) {
      setError('Please add at least 2 locations to calculate a route');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const routeRequest = {
        locations: locations.map(loc => ({
          address: loc.address,
          lat: loc.lat !== 0 ? loc.lat : undefined,
          lng: loc.lng !== 0 ? loc.lng : undefined,
        })),
      };

      const result = await routeService.optimizeRoute(routeRequest);
      setOptimizedRoute(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate route';
      setError(errorMessage);
      console.error('Route calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Route Optimizer</h1>
                <p className="text-sm text-gray-500">Find the most efficient route between multiple locations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Input and Results */}
          <div className="lg:col-span-1 space-y-6">
            <LocationInput
              locations={locations}
              onAddLocation={handleAddLocation}
              onRemoveLocation={handleRemoveLocation}
              onClearAll={handleClearAll}
            />

            {/* Calculate Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                onClick={handleCalculateRoute}
                disabled={locations.length < 2 || isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator size={20} />
                    Calculate Optimal Route
                  </>
                )}
              </button>
              
              {locations.length < 2 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Add at least 2 locations to calculate route
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                    {error.includes('Backend server') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p>Make sure to:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Install Python dependencies: <code className="bg-red-100 px-1 rounded">pip install -r backend/requirements.txt</code></li>
                          <li>Start the backend server: <code className="bg-red-100 px-1 rounded">cd backend && python main.py</code></li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <RouteResults route={optimizedRoute} isLoading={isLoading} />
          </div>

          {/* Right Side - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Route Map</h2>
              <div className="h-96 lg:h-[600px]">
                <RouteMap route={optimizedRoute} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Route Optimizer - Built with React, TypeScript, and Leaflet</p>
            <p className="mt-1">Powered by OpenStreetMap and Python FastAPI backend</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;