import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { GoogleMap, Marker as GMarker, Polyline as GPolyline, useJsApiLoader } from '@react-google-maps/api';
import L from 'leaflet';
import { OptimizedRoute } from '../types';
import { formatDistance, formatTime } from '../utils/validation';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteMapProps {
  route: OptimizedRoute | null;
  isLoading: boolean;
}

// Component to fit bounds when route changes
const FitBounds: React.FC<{ route: OptimizedRoute }> = ({ route }) => {
  const map = useMap();
  
  useEffect(() => {
    if (route && route.locations.length > 0) {
      const bounds = L.latLngBounds(route.locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [route, map]);
  
  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({ route, isLoading }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapRef = useRef<L.Map | google.maps.Map | null>(null);
  const { isLoaded, loadError } = useJsApiLoader({ 
    googleMapsApiKey: apiKey || '',
    libraries: ['geometry']
  });
  const { t } = useTranslation();
  const [mapError, setMapError] = useState<string | null>(null);

  // Create custom numbered icons for Leaflet
  const createNumberedIcon = (number: number, isStart: boolean = false, isEnd: boolean = false) => {
    let color = '#3b82f6'; // Default blue
    if (isStart) color = '#22c55e'; // Green for start
    if (isEnd) color = '#ef4444'; // Red for end
    
    const textColor = 'white';
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${textColor};
          font-weight: bold;
          font-size: 14px;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-family: system-ui, -apple-system, sans-serif;
        ">
          ${number}
        </div>
      `,
      className: 'custom-numbered-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  useEffect(() => {
    if (route && route.locations.length > 0 && mapRef.current) {
      try {
        if (apiKey && isLoaded && (mapRef.current as any).fitBounds) {
          const bounds = new window.google.maps.LatLngBounds();
          route.locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
          (mapRef.current as google.maps.Map).fitBounds(bounds);
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
        setMapError('Error adjusting map view');
      }
    }
  }, [route, apiKey, isLoaded]);

  const defaultCenter = { lat: 40.7128, lng: -74.0060 };
  const defaultZoom = 10;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('calculating_route')}</p>
        </div>
      </div>
    );
  }

  if (!route || route.locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">{t('map_no_route')}</p>
          <p className="text-sm">{t('map_add_locations')}</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-lg mb-2">Map Error</p>
          <p className="text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  const routeCoordinates = route.route_order.map(
    index => ({ lat: route.locations[index].lat, lng: route.locations[index].lng })
  );

  // Validate coordinates
  const validCoordinates = routeCoordinates.filter(coord => 
    coord.lat >= -90 && coord.lat <= 90 && coord.lng >= -180 && coord.lng <= 180
  );

  if (validCoordinates.length !== routeCoordinates.length) {
    return (
      <div className="h-full flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="text-center text-yellow-600 dark:text-yellow-400">
          <p className="text-lg mb-2">Invalid Coordinates</p>
          <p className="text-sm">Some locations have invalid coordinates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg overflow-hidden shadow-md">
      {apiKey ? (
        loadError ? (
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="text-lg mb-2">Google Maps Error</p>
              <p className="text-sm">Failed to load Google Maps</p>
            </div>
          </div>
        ) : !isLoaded ? (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <div className="loading-spinner mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading Google Maps...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={validCoordinates[0] || defaultCenter}
            zoom={defaultZoom}
            onLoad={map => { mapRef.current = map; }}
            options={{
              zoomControl: true,
              mapTypeControl: false,
              scaleControl: true,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: true,
            }}
          >
            {validCoordinates.length > 1 && (
              <GPolyline 
                path={validCoordinates} 
                options={{ 
                  strokeColor: '#3b82f6', 
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                }} 
              />
            )}
            {route.route_order.map((locationIndex, orderIndex) => {
              const location = route.locations[locationIndex];
              const isStart = orderIndex === 0;
              const isEnd = orderIndex === route.route_order.length - 1;
              const label = `${orderIndex + 1}`;
              
              return (
                <GMarker
                  key={`${location.id}-${orderIndex}`}
                  position={{ lat: location.lat, lng: location.lng }}
                  label={{
                    text: label,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                  title={`${isStart ? 'Start' : isEnd ? 'End' : `Stop ${orderIndex + 1}`}: ${location.address}`}
                />
              );
            })}
          </GoogleMap>
        )
      ) : (
        <MapContainer
          center={[validCoordinates[0]?.lat || defaultCenter.lat, validCoordinates[0]?.lng || defaultCenter.lng]}
          zoom={defaultZoom}
          className="h-full w-full"
          ref={mapRef as React.MutableRefObject<L.Map | null>}
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VGlsZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+"
          />
          
          {route && <FitBounds route={route} />}
          
          {validCoordinates.length > 1 && (
            <Polyline
              positions={validCoordinates.map(c => [c.lat, c.lng]) as [number, number][]}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
            />
          )}
          
          {route.route_order.map((locationIndex, orderIndex) => {
            const location = route.locations[locationIndex];
            const isStart = orderIndex === 0;
            const isEnd = orderIndex === route.route_order.length - 1;
            
            return (
              <Marker
                key={`${location.id}-${orderIndex}`}
                position={[location.lat, location.lng]}
                icon={createNumberedIcon(orderIndex + 1, isStart, isEnd)}
              >
                <Popup>
                  <div className="text-sm max-w-xs">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      {isStart && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">START</span>}
                      {isEnd && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">END</span>}
                      {!isStart && !isEnd && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">STOP {orderIndex + 1}</span>}
                    </div>
                    <div className="text-gray-700 mb-2 break-words">{location.address}</div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
                      {route.segments && route.segments[orderIndex] && (
                        <div className="pt-1 border-t">
                          <div>Distance to next: {formatDistance(route.segments[orderIndex].distance)}</div>
                          <div>Time to next: {formatTime(route.segments[orderIndex].time)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
};