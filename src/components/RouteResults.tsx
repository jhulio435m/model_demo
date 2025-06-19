import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, MapPin, Clock, Route, FileText, Share2, Copy, Check } from 'lucide-react';
import Papa from 'papaparse';
import html2pdf from 'html2pdf.js';
import { OptimizedRoute } from '../types';
import { formatDistance, formatTime } from '../utils/validation';
import toast from 'react-hot-toast';

interface RouteResultsProps {
  route: OptimizedRoute | null;
  isLoading: boolean;
}

export const RouteResults: React.FC<RouteResultsProps> = ({ route, isLoading }) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const exportToCSV = async () => {
    if (!route) return;

    setIsExporting(true);
    try {
      const csvData = route.route_order.map((locationIndex, orderIndex) => {
        const location = route.locations[locationIndex];
        return {
          order: orderIndex + 1,
          address: location.address,
          latitude: location.lat,
          longitude: location.lng,
          category: location.category || '',
          priority: location.priority || 1,
        };
      });

      // Add summary row
      csvData.push({
        order: '',
        address: '--- ROUTE SUMMARY ---',
        latitude: '',
        longitude: '',
        category: `Total Distance: ${formatDistance(route.total_distance)}`,
        priority: `Total Time: ${formatTime(route.total_time)}`,
      } as any);

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
      URL.revokeObjectURL(url);
      
      toast.success('Route exported to CSV successfully');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!route) return;

    setIsExporting(true);
    try {
      const element = document.getElementById('route-results-content');
      if (!element) {
        throw new Error('Content element not found');
      }

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `optimized_route_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
        },
        jsPDF: { 
          unit: 'in', 
          format: 'letter', 
          orientation: 'portrait' 
        }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success('Route exported to PDF successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const shareRoute = async () => {
    if (!route) return;

    const routeData = {
      locations: route.locations,
      route_order: route.route_order,
      total_distance: route.total_distance,
      total_time: route.total_time,
    };

    const shareText = `Route Optimizer Results:
${route.locations.length} stops
Total Distance: ${formatDistance(route.total_distance)}
Total Time: ${formatTime(route.total_time)}

Route Order:
${route.route_order.map((locationIndex, orderIndex) => 
  `${orderIndex + 1}. ${route.locations[locationIndex].address}`
).join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Optimized Route',
          text: shareText,
        });
      } catch (error) {
        console.error('Share error:', error);
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      toast.success('Route details copied to clipboard');
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Clipboard error:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('calculating_route')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t('route_results')}</h2>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <Route size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p>{t('no_route_yet')}</p>
          <p className="text-sm mt-2">{t('calculate_hint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{t('route_results')}</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            title="Export to CSV"
          >
            {isExporting ? (
              <div className="loading-spinner w-4 h-4" />
            ) : (
              <Download size={16} />
            )}
            CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            title="Export to PDF"
          >
            {isExporting ? (
              <div className="loading-spinner w-4 h-4" />
            ) : (
              <FileText size={16} />
            )}
            PDF
          </button>
          <button
            onClick={shareRoute}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Share route"
          >
            {copiedToClipboard ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Share2 size={16} />
            )}
            Share
          </button>
        </div>
      </div>

      <div id="route-results-content">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
              <span className="font-medium text-blue-800 dark:text-blue-200">{t('total_stops')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{route.locations.length}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Route className="text-green-600 dark:text-green-400" size={20} />
              <span className="font-medium text-green-800 dark:text-green-200">{t('total_distance')}</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatDistance(route.total_distance)}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-purple-600 dark:text-purple-400" size={20} />
              <span className="font-medium text-purple-800 dark:text-purple-200">{t('estimated_time')}</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatTime(route.total_time)}
            </p>
          </div>
        </div>

        {/* Optimization Stats */}
        {route.optimization_stats && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Optimization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Algorithm:</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{route.optimization_stats.algorithm_used}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Computation Time:</span>
                <div className="font-medium text-gray-900 dark:text-gray-100">{route.optimization_stats.computation_time.toFixed(2)}s</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Improvement:</span>
                <div className="font-medium text-green-600 dark:text-green-400">{route.optimization_stats.improvement_percentage.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Route Order */}
        <div>
          <h3 className="font-semibold mb-4">{t('route_order')}</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {route.route_order.map((locationIndex, orderIndex) => {
              const location = route.locations[locationIndex];
              const isStart = orderIndex === 0;
              const isEnd = orderIndex === route.route_order.length - 1;
              const segment = route.segments?.[orderIndex];
              
              return (
                <div
                  key={`${location.id}-${orderIndex}`}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                    ${isStart ? 'bg-green-500' : isEnd ? 'bg-red-500' : 'bg-blue-500'}
                  `}>
                    {orderIndex + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {isStart && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full font-medium">
                          {t('start')}
                        </span>
                      )}
                      {isEnd && (
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full font-medium">
                          {t('end')}
                        </span>
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100 break-words">
                        {location.address}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                    {segment && !isEnd && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 flex gap-4">
                        <span>Next: {formatDistance(segment.distance)}</span>
                        <span>Time: {formatTime(segment.time)}</span>
                      </div>
                    )}
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