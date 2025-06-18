import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, MapPin, Clock, Route } from 'lucide-react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { OptimizedRoute } from '../types';

interface RouteResultsProps {
  route: OptimizedRoute | null;
  isLoading: boolean;
}

export const RouteResults: React.FC<RouteResultsProps> = ({ route, isLoading }) => {
  const { t } = useTranslation();
  const exportToCSV = () => {
    if (!route) return;

    const csvData = route.route_order.map((locationIndex, orderIndex) => {
      const location = route.locations[locationIndex];
      return {
        order: orderIndex + 1,
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `optimized_route_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (!route) return;

    const element = document.getElementById('route-results-content');
    if (!element) return;

    const opt = {
      margin: 1,
      filename: `optimized_route_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">{t('calculating_route')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t('route_results')}</h2>
        <div className="text-center text-gray-500 py-8">
          <Route size={48} className="mx-auto mb-4 text-gray-300" />
          <p>{t('no_route_yet')}</p>
          <p className="text-sm mt-2">{t('calculate_hint')}</p>
        </div>
      </div>
    );
  }

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${distance.toFixed(0)} m`;
    }
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{t('route_results')}</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div id="route-results-content">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-blue-600" size={20} />
              <span className="font-medium text-blue-800">{t('total_stops')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{route.locations.length}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Route className="text-green-600" size={20} />
              <span className="font-medium text-green-800">{t('total_distance')}</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatDistance(route.total_distance)}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-purple-600" size={20} />
              <span className="font-medium text-purple-800">{t('estimated_time')}</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatTime(route.total_time)}
            </p>
          </div>
        </div>

        {/* Route Order */}
        <div>
          <h3 className="font-semibold mb-4">{t('route_order')}</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {route.route_order.map((locationIndex, orderIndex) => {
              const location = route.locations[locationIndex];
              const isStart = orderIndex === 0;
              const isEnd = orderIndex === route.route_order.length - 1;
              
              return (
                <div
                  key={`${location.id}-${orderIndex}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-blue-500'}
                  `}>
                    {orderIndex + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isStart && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          {t('start')}
                        </span>
                      )}
                      {isEnd && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                          {t('end')}
                        </span>
                      )}
                      <span className="font-medium text-gray-900">
                        {location.address}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
