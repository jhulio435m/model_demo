import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { GoogleMap, Marker as GMarker, Polyline as GPolyline, useJsApiLoader } from '@react-google-maps/api';
import L from 'leaflet';
import { OptimizedRoute } from '../types';

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

export const RouteMap: React.FC<RouteMapProps> = ({ route, isLoading }) => {
  const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const mapRef = useRef<L.Map | google.maps.Map | null>(null);
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey || '' });
  const { t } = useTranslation();

  // Create custom numbered icons for Leaflet
  const createNumberedIcon = (number: number, isStart: boolean = false) => {
    const color = isStart ? '#22c55e' : '#3b82f6';
    const textColor = 'white';
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${textColor};
          font-weight: bold;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${number}
        </div>
      `,
      className: 'custom-numbered-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  useEffect(() => {
    if (route && route.locations.length > 0 && mapRef.current) {
      if (apiKey && (mapRef.current as any).fitBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        route.locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
        (mapRef.current as google.maps.Map).fitBounds(bounds);
      } else if (mapRef.current instanceof L.Map) {
        const bounds = L.latLngBounds(route.locations.map(loc => [loc.lat, loc.lng]));
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [route, apiKey, isLoaded]);

  const defaultCenter = { lat: 40.7128, lng: -74.0060 };
  const defaultZoom = 10;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">{t('calculating_route')}</p>
        </div>
      </div>
    );
  }

  if (!route || route.locations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">{t('map_no_route')}</p>
          <p className="text-sm">{t('map_add_locations')}</p>
        </div>
      </div>
    );
  }

  const routeCoordinates = route.route_order.map(
    index => ({ lat: route.locations[index].lat, lng: route.locations[index].lng })
  );

  return (
    <div className="h-full rounded-lg overflow-hidden shadow-md">
      {apiKey ? (
        !isLoaded ? (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="loading-spinner" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={defaultCenter}
            zoom={defaultZoom}
            onLoad={map => { mapRef.current = map; }}
          >
            {routeCoordinates.length > 1 && (
              <GPolyline path={routeCoordinates} options={{ strokeColor: '#3b82f6', strokeWeight: 4 }} />
            )}
            {route.route_order.map((locationIndex, orderIndex) => {
              const location = route.locations[locationIndex];
              const label = `${orderIndex + 1}`;
              return (
                <GMarker
                  key={location.id}
                  position={{ lat: location.lat, lng: location.lng }}
                  label={label}
                />
              );
            })}
          </GoogleMap>
        )
      ) : (
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={defaultZoom}
          className="h-full w-full"
          ref={mapRef as React.MutableRefObject<L.Map | null>}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {routeCoordinates.length > 1 && (
            <Polyline
              positions={routeCoordinates.map(c => [c.lat, c.lng]) as [number, number][]}
              color="#3b82f6"
              weight={4}
              opacity={0.8}
            />
          )}
          {route.route_order.map((locationIndex, orderIndex) => {
            const location = route.locations[locationIndex];
            const isStart = orderIndex === 0;
            return (
              <Marker
                key={location.id}
                position={[location.lat, location.lng]}
                icon={createNumberedIcon(orderIndex + 1, isStart)}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">
                      {isStart ? 'Start' : `Stop ${orderIndex + 1}`}
                    </div>
                    <div className="text-gray-600 mb-1">{location.address}</div>
                    <div className="text-xs text-gray-500">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
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
