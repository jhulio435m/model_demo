import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingUp, Clock, Fuel, Leaf } from 'lucide-react';
import { OptimizedRoute } from '../types';

interface RouteAnalyticsProps {
  route: OptimizedRoute | null;
}

export const RouteAnalytics: React.FC<RouteAnalyticsProps> = ({ route }) => {
  if (!route) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          Route Analytics
        </h3>
        <div className="text-center text-gray-500 py-8">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No route data available</p>
          <p className="text-sm mt-2">Calculate a route to see detailed analytics</p>
        </div>
      </div>
    );
  }

  // Generate segment analysis data
  const segmentData = route.segments?.map((segment, index) => ({
    segment: `${index + 1}`,
    distance: segment.distance / 1000, // Convert to km
    time: segment.time / 60, // Convert to minutes
    speed: (segment.distance / 1000) / (segment.time / 3600), // km/h
  })) || [];

  // Calculate environmental impact
  const calculateEnvironmentalImpact = () => {
    const totalDistanceKm = route.total_distance / 1000;
    const fuelConsumption = totalDistanceKm * 0.08; // Liters per km (average)
    const co2Emissions = fuelConsumption * 2.31; // kg CO2 per liter
    const costEstimate = fuelConsumption * 1.5; // Cost per liter

    return {
      fuel: fuelConsumption,
      co2: co2Emissions,
      cost: costEstimate,
    };
  };

  const environmentalData = calculateEnvironmentalImpact();

  // Calculate efficiency metrics
  const calculateEfficiencyMetrics = () => {
    const totalStops = route.locations.length;
    const avgDistancePerStop = route.total_distance / totalStops / 1000;
    const avgTimePerStop = route.total_time / totalStops / 60;
    const routeEfficiency = route.optimization_stats?.improvement_percentage || 0;

    return {
      avgDistancePerStop,
      avgTimePerStop,
      routeEfficiency,
      totalStops,
    };
  };

  const efficiencyMetrics = calculateEfficiencyMetrics();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <BarChart3 className="text-blue-600" size={24} />
        Route Analytics
      </h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-600" size={20} />
            <span className="font-medium text-blue-800">Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {efficiencyMetrics.routeEfficiency.toFixed(1)}%
          </div>
          <div className="text-sm text-blue-700">Optimization gain</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="text-green-600" size={20} />
            <span className="font-medium text-green-800">Fuel Cost</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            ${environmentalData.cost.toFixed(2)}
          </div>
          <div className="text-sm text-green-700">Estimated cost</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-purple-600" size={20} />
            <span className="font-medium text-purple-800">Avg Time/Stop</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {efficiencyMetrics.avgTimePerStop.toFixed(1)}m
          </div>
          <div className="text-sm text-purple-700">Per location</div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="text-red-600" size={20} />
            <span className="font-medium text-red-800">CO₂ Emissions</span>
          </div>
          <div className="text-2xl font-bold text-red-900">
            {environmentalData.co2.toFixed(1)} kg
          </div>
          <div className="text-sm text-red-700">Carbon footprint</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Distance Analysis */}
        <div>
          <h4 className="font-medium mb-4">Distance per Segment</h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={segmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip formatter={(value) => [`${(value as number).toFixed(2)} km`, 'Distance']} />
              <Area type="monotone" dataKey="distance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Speed Analysis */}
        <div>
          <h4 className="font-medium mb-4">Average Speed per Segment</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={segmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="segment" />
              <YAxis />
              <Tooltip formatter={(value) => [`${(value as number).toFixed(1)} km/h`, 'Speed']} />
              <Line type="monotone" dataKey="speed" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Impact Summary */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
          <Leaf size={20} />
          Environmental Impact Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-green-700 font-medium">Fuel Consumption:</span>
            <div className="text-green-900">{environmentalData.fuel.toFixed(2)} liters</div>
          </div>
          <div>
            <span className="text-green-700 font-medium">CO₂ Emissions:</span>
            <div className="text-green-900">{environmentalData.co2.toFixed(2)} kg</div>
          </div>
          <div>
            <span className="text-green-700 font-medium">Estimated Cost:</span>
            <div className="text-green-900">${environmentalData.cost.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Optimization Details */}
      {route.optimization_stats && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-3">Optimization Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Algorithm:</span>
              <div className="text-blue-900">{route.optimization_stats.algorithm_used}</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Computation Time:</span>
              <div className="text-blue-900">{route.optimization_stats.computation_time.toFixed(2)}s</div>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Iterations:</span>
              <div className="text-blue-900">{route.optimization_stats.iterations}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
