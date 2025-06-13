import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, MapPin, Zap } from 'lucide-react';
import { OptimizedRoute } from '../types';

interface RouteComparisonProps {
  routes: OptimizedRoute[];
  routeNames: string[];
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({ routes, routeNames }) => {
  if (routes.length < 2) return null;

  const comparisonData = routes.map((route, index) => ({
    name: routeNames[index] || `Route ${index + 1}`,
    distance: route.total_distance / 1000, // Convert to km
    time: route.total_time / 60, // Convert to minutes
    stops: route.locations.length,
    efficiency: route.optimization_stats?.improvement_percentage || 0,
  }));

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const formatDistance = (distance: number) => `${distance.toFixed(1)} km`;
  const formatTime = (time: number) => `${Math.round(time)} min`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <TrendingUp className="text-blue-600" size={24} />
        Route Comparison
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-blue-600" size={20} />
            <span className="font-medium text-blue-800">Best Distance</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatDistance(Math.min(...comparisonData.map(r => r.distance)))}
          </div>
          <div className="text-sm text-blue-700">
            {comparisonData.find(r => r.distance === Math.min(...comparisonData.map(d => d.distance)))?.name}
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-green-600" size={20} />
            <span className="font-medium text-green-800">Best Time</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {formatTime(Math.min(...comparisonData.map(r => r.time)))}
          </div>
          <div className="text-sm text-green-700">
            {comparisonData.find(r => r.time === Math.min(...comparisonData.map(d => d.time)))?.name}
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-purple-600" size={20} />
            <span className="font-medium text-purple-800">Best Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {Math.max(...comparisonData.map(r => r.efficiency)).toFixed(1)}%
          </div>
          <div className="text-sm text-purple-700">
            {comparisonData.find(r => r.efficiency === Math.max(...comparisonData.map(d => d.efficiency)))?.name}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distance & Time Comparison */}
        <div>
          <h4 className="font-medium mb-4">Distance & Time Comparison</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'distance' ? formatDistance(value as number) : formatTime(value as number),
                  name === 'distance' ? 'Distance' : 'Time'
                ]}
              />
              <Bar yAxisId="left" dataKey="distance" fill="#3b82f6" name="distance" />
              <Bar yAxisId="right" dataKey="time" fill="#ef4444" name="time" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency Distribution */}
        <div>
          <h4 className="font-medium mb-4">Efficiency Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={comparisonData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, efficiency }) => `${name}: ${efficiency.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="efficiency"
              >
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Efficiency']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="mt-6">
        <h4 className="font-medium mb-4">Detailed Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Route</th>
                <th className="text-right py-2">Distance</th>
                <th className="text-right py-2">Time</th>
                <th className="text-right py-2">Stops</th>
                <th className="text-right py-2">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((route, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 font-medium">{route.name}</td>
                  <td className="text-right py-2">{formatDistance(route.distance)}</td>
                  <td className="text-right py-2">{formatTime(route.time)}</td>
                  <td className="text-right py-2">{route.stops}</td>
                  <td className="text-right py-2">{route.efficiency.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};