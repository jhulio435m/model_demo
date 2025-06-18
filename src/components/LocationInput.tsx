import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import Papa from 'papaparse';
import { Location } from '../types';
import { useTranslation } from 'react-i18next';
import UTMLatLng from 'utm-latlng';

interface LocationInputProps {
  locations: Location[];
  onAddLocation: (location: Omit<Location, 'id'>) => void;
  onRemoveLocation: (id: string) => void;
  onClearAll: () => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  locations,
  onAddLocation,
  onRemoveLocation,
  onClearAll,
}) => {
  const { t } = useTranslation();
  const utmConverter = new UTMLatLng();

  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lng: '' });
  const [utm, setUtm] = useState({ easting: '', northing: '', zoneNumber: '', zoneLetter: '' });
  const [inputMode, setInputMode] = useState<'address' | 'coordinates' | 'utm'>('address');

  const handleAddLocation = () => {
    if (inputMode === 'address' && address.trim()) {
      onAddLocation({
        address: address.trim(),
        lat: 0,
        lng: 0,
      });
      setAddress('');
    } else if (inputMode === 'coordinates' && coordinates.lat && coordinates.lng) {
      const lat = parseFloat(coordinates.lat.replace(',', '.'));
      const lng = parseFloat(coordinates.lng.replace(',', '.'));

      if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid coordinates');
        return;
      }

      onAddLocation({
        address: `${lat}, ${lng}`,
        lat,
        lng,
      });
      setCoordinates({ lat: '', lng: '' });
    } else if (
      inputMode === 'utm' &&
      utm.easting &&
      utm.northing &&
      utm.zoneNumber &&
      utm.zoneLetter
    ) {
      const easting = parseFloat(utm.easting);
      const northing = parseFloat(utm.northing);
      const zoneNumber = parseInt(utm.zoneNumber, 10);
      const zoneLetter = utm.zoneLetter.toUpperCase() as any;

      if (isNaN(easting) || isNaN(northing) || isNaN(zoneNumber)) {
        alert('Please enter valid UTM coordinates');
        return;
      }

      const { lat, lng } = utmConverter.convertUtmToLatLng(
        easting,
        northing,
        zoneNumber,
        zoneLetter
      ) as { lat: number; lng: number };

      onAddLocation({
        address: `${easting},${northing} (${zoneNumber}${zoneLetter})`,
        lat,
        lng,
      });
      setUtm({ easting: '', northing: '', zoneNumber: '', zoneLetter: '' });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        data.forEach((row, index) => {
          if (row.address || (row.lat && row.lng)) {
            const lat = row.lat ? parseFloat(row.lat) : 0;
            const lng = row.lng ? parseFloat(row.lng) : 0;
            
            onAddLocation({
              address: row.address || `${lat}, ${lng}`,
              lat: isNaN(lat) ? 0 : lat,
              lng: isNaN(lng) ? 0 : lng,
            });
          }
        });
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });
    
    // Reset file input
    event.target.value = '';
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAddLocation();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">{t('add_locations')}</h2>
      
      {/* Input Mode Toggle */}
      <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'address'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setInputMode('address')}
        >
          {t('address')}
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'coordinates'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setInputMode('coordinates')}
        >
          {t('coordinates')}
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'utm'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setInputMode('utm')}
        >
          {t('utm')}
        </button>
      </div>

      {/* Input Fields */}
      {inputMode === 'address' ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('address')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddLocation}
            disabled={!address.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-10"
          >
            <Plus size={20} />
          </button>
        </div>
      ) : inputMode === 'coordinates' ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={coordinates.lat}
            onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
            placeholder={t('latitude')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={coordinates.lng}
            onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
            placeholder={t('longitude')}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddLocation}
            disabled={!coordinates.lat || !coordinates.lng}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-10"
          >
            <Plus size={20} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input
            type="number"
            value={utm.easting}
            onChange={e => setUtm({ ...utm, easting: e.target.value })}
            placeholder={t('easting')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={utm.northing}
            onChange={e => setUtm({ ...utm, northing: e.target.value })}
            placeholder={t('northing')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={utm.zoneNumber}
            onChange={e => setUtm({ ...utm, zoneNumber: e.target.value })}
            placeholder={t('zone_number')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={utm.zoneLetter}
            onChange={e => setUtm({ ...utm, zoneLetter: e.target.value })}
            placeholder={t('zone_letter')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddLocation}
            disabled={!utm.easting || !utm.northing || !utm.zoneNumber || !utm.zoneLetter}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-full col-span-2"
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* File Upload */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          <Upload size={16} />
          {t('upload_csv')}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <p className="text-xs text-gray-500 mt-1">
          {t('csv_help')}
        </p>
      </div>

      {/* Locations List */}
      {locations.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">{t('locations')} ({locations.length})</h3>
            <button
              onClick={onClearAll}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              {t('clear_all')}
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
            {locations.map((location, index) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {location.address}
                    </span>
                  </div>
                  {location.lat !== 0 && location.lng !== 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveLocation(location.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
