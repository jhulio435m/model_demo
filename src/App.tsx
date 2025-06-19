import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Calculator,
  AlertCircle,
  Settings,
  BarChart3,
  Folder,
  Moon,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { LocationInput } from "./components/LocationInput";
import { RouteMap } from "./components/RouteMap";
import { RouteResults } from "./components/RouteResults";
import { RouteSettings } from "./components/RouteSettings";
import { RouteComparison } from "./components/RouteComparison";
import { SavedRoutes } from "./components/SavedRoutes";
import { RouteAnalytics } from "./components/RouteAnalytics";
import { routeService } from "./services/api";
import { Location, OptimizedRoute, RouteRequest, LoadingState } from "./types";
import { useTranslation } from "react-i18next";
import { storage } from "./utils/storage";
import { handleError, showErrorToast, validateRouteRequest } from "./utils/errorHandler";
import { generateId } from "./utils/validation";
import toast from "react-hot-toast";

function App() {
  const { t, i18n } = useTranslation();
  
  // State management
  const [language, setLanguage] = useState(() => storage.getLanguage());
  const [darkMode, setDarkMode] = useState(() => storage.getDarkMode());
  const [routeSettings, setRouteSettings] = useState<Partial<RouteRequest>>(() => storage.getRouteSettings());
  const [locations, setLocations] = useState<Location[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [comparisonRoutes, setComparisonRoutes] = useState<OptimizedRoute[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"route" | "analytics" | "comparison" | "saved">("route");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Initialize language and theme
  useEffect(() => {
    i18n.changeLanguage(language);
    storage.saveLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    storage.saveDarkMode(darkMode);
  }, [darkMode]);

  // Save route settings
  useEffect(() => {
    storage.saveRouteSettings(routeSettings);
  }, [routeSettings]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Backend health check
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const isHealthy = await routeService.healthCheck();
        setBackendStatus(isHealthy ? 'online' : 'offline');
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAddLocation = useCallback((locationData: Omit<Location, "id">) => {
    const newLocation: Location = {
      ...locationData,
      id: generateId(),
    };
    setLocations((prev) => [...prev, newLocation]);
    setError(null);
    
    // Clear route if locations change significantly
    if (optimizedRoute && optimizedRoute.locations.length !== locations.length + 1) {
      setOptimizedRoute(null);
    }
  }, [locations.length, optimizedRoute]);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    if (optimizedRoute) {
      setOptimizedRoute(null);
    }
  }, [optimizedRoute]);

  const handleClearAll = useCallback(() => {
    setLocations([]);
    setOptimizedRoute(null);
    setComparisonRoutes([]);
    setError(null);
  }, []);

  const handleCalculateRoute = useCallback(async () => {
    // Validation
    const validationErrors = validateRouteRequest({ locations });
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    if (!isOnline) {
      toast.error('No internet connection. Please check your connection and try again.');
      return;
    }

    if (backendStatus === 'offline') {
      toast.error('Backend server is not available. Please start the Python server.');
      return;
    }

    setLoadingState({ isLoading: true, message: 'Optimizing route...' });
    setError(null);

    try {
      const routeRequest: RouteRequest = {
        locations: locations.map((loc) => ({
          address: loc.address,
          lat: loc.lat !== 0 ? loc.lat : undefined,
          lng: loc.lng !== 0 ? loc.lng : undefined,
          category: loc.category,
          priority: loc.priority,
          timeWindow: loc.timeWindow,
          serviceTime: loc.serviceTime,
        })),
        ...routeSettings,
      };

      const result = await routeService.optimizeRoute(routeRequest);
      setOptimizedRoute(result);

      // Add to comparison if we have previous routes
      if (optimizedRoute) {
        setComparisonRoutes((prev) => [
          ...prev.slice(-2),
          optimizedRoute,
          result,
        ]);
      }

      toast.success('Route optimized successfully!');
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      showErrorToast(appError);
    } finally {
      setLoadingState({ isLoading: false });
    }
  }, [locations, routeSettings, optimizedRoute, isOnline, backendStatus]);

  const handleLoadRoute = useCallback((route: OptimizedRoute) => {
    setOptimizedRoute(route);
    setLocations(route.locations);
    setActiveTab("route");
    toast.success('Route loaded successfully');
  }, []);

  const tabs = [
    { id: "route", label: t("route_planning"), icon: MapPin },
    { id: "analytics", label: t("analytics"), icon: BarChart3 },
    { id: "comparison", label: t("comparison"), icon: Settings },
    { id: "saved", label: t("saved_routes"), icon: Folder },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#374151' : '#ffffff',
            color: darkMode ? '#f9fafb' : '#111827',
          },
        }}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("route_optimizer_title")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="text-green-500" size={16} />
                ) : (
                  <WifiOff className="text-red-500" size={16} />
                )}
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-green-500' : 
                  backendStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`} title={`Backend: ${backendStatus}`} />
              </div>

              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-sm border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "route" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Input and Settings */}
            <div className="lg:col-span-1 space-y-6">
              <LocationInput
                locations={locations}
                onAddLocation={handleAddLocation}
                onRemoveLocation={handleRemoveLocation}
                onClearAll={handleClearAll}
              />

              <RouteSettings
                settings={routeSettings}
                onSettingsChange={setRouteSettings}
                locations={locations}
              />

              {/* Calculate Button */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <button
                  onClick={handleCalculateRoute}
                  disabled={locations.length < 2 || loadingState.isLoading || !isOnline || backendStatus === 'offline'}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingState.isLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      {loadingState.message || 'Calculating...'}
                    </>
                  ) : (
                    <>
                      <Calculator size={20} />
                      {t("calculate_route")}
                    </>
                  )}
                </button>

                {locations.length < 2 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {t("at_least_two")}
                  </p>
                )}

                {!isOnline && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    No internet connection
                  </p>
                )}

                {backendStatus === 'offline' && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    Backend server offline
                  </p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="text-red-500 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">
                        {t("error")}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      {error.includes("Backend server") && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          <p>Make sure to:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>
                              Install Python dependencies:{" "}
                              <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                                pip install -r backend/requirements.txt
                              </code>
                            </li>
                            <li>
                              Start the backend server:{" "}
                              <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                                cd backend && python main.py
                              </code>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <RouteResults route={optimizedRoute} isLoading={loadingState.isLoading} />
            </div>

            {/* Right Side - Map */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">{t("route_map")}</h2>
                <div className="h-96 lg:h-[600px]">
                  <RouteMap route={optimizedRoute} isLoading={loadingState.isLoading} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && <RouteAnalytics route={optimizedRoute} />}

        {activeTab === "comparison" && (
          <RouteComparison
            routes={comparisonRoutes}
            routeNames={comparisonRoutes.map(
              (_, index) => `Route ${index + 1}`,
            )}
          />
        )}

        {activeTab === "saved" && (
          <SavedRoutes
            currentRoute={optimizedRoute}
            onLoadRoute={handleLoadRoute}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {t("route_optimizer_title")} - Built with React, TypeScript, and
              Leaflet
            </p>
            <p className="mt-1">
              Powered by OpenStreetMap and Python FastAPI backend
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;