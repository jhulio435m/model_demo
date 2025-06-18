import React, { useState } from 'react';
import { Settings, Car, Truck, Bike, User, Target, MapPin } from 'lucide-react';
import { RouteRequest } from '../types';
import { useTranslation } from 'react-i18next';

interface RouteSettingsProps {
  settings: Partial<RouteRequest>;
  onSettingsChange: (settings: Partial<RouteRequest>) => void;
  locations: any[];
}

export const RouteSettings: React.FC<RouteSettingsProps> = ({
  settings,
  onSettingsChange,
  locations,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const vehicleTypes = [
    { value: 'car', label: 'Car', icon: Car, description: 'Standard vehicle' },
    { value: 'truck', label: 'Truck', icon: Truck, description: 'Heavy vehicle with restrictions' },
    { value: 'bike', label: 'Bicycle', icon: Bike, description: 'Bicycle routes' },
    { value: 'walking', label: 'Walking', icon: User, description: 'Pedestrian routes' },
  ];

  const optimizationTypes = [
    { value: 'distance', label: 'Shortest Distance', description: 'Minimize total distance' },
    { value: 'time', label: 'Fastest Time', description: 'Minimize travel time' },
    { value: 'balanced', label: 'Balanced', description: 'Balance distance and time' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="text-gray-600" size={20} />
          <span className="font-medium">{t('route_settings')}</span>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t space-y-6">
          {/* Optimization Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Target className="inline mr-2" size={16} />
              {t('optimization_goal')}
            </label>
            <div className="space-y-2">
              {optimizationTypes.map((type) => (
                <label key={type.value} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="optimization_type"
                    value={type.value}
                    checked={settings.optimization_type === type.value}
                    onChange={(e) => onSettingsChange({ 
                      ...settings, 
                      optimization_type: e.target.value as 'distance' | 'time' | 'balanced' 
                    })}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('vehicle_type')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {vehicleTypes.map((vehicle) => {
                const IconComponent = vehicle.icon;
                return (
                  <button
                    key={vehicle.value}
                    onClick={() => onSettingsChange({ 
                      ...settings, 
                      vehicle_type: vehicle.value as 'car' | 'truck' | 'bike' | 'walking' 
                    })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      settings.vehicle_type === vehicle.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="mx-auto mb-1" size={20} />
                    <div className="text-xs font-medium">{vehicle.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline mr-2" size={16} />
              {t('starting_location')}
            </label>
            <select
              value={settings.start_location ?? ''}
              onChange={(e) => onSettingsChange({ 
                ...settings, 
                start_location: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Auto-select optimal start</option>
              {locations.map((location, index) => (
                <option key={location.id} value={index}>
                  {index + 1}. {location.address}
                </option>
              ))}
            </select>
          </div>

          {/* Return to Start */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.return_to_start ?? false}
                onChange={(e) => onSettingsChange({ 
                  ...settings, 
                  return_to_start: e.target.checked 
                })}
                className="rounded"
              />
              <div>
                <div className="font-medium text-sm">{t('return_to_start')}</div>
                <div className="text-xs text-gray-500">End the route at the starting location</div>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
