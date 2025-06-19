import React, { useState, useCallback } from 'react';
import { Plus, Upload, X, MapPin, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Location } from '../types';
import { useTranslation } from 'react-i18next';
import UTMLatLng from 'utm-latlng';
import { validateCoordinates, validateAddress, validateUTM, sanitizeInput, generateId, debounce } from '../utils/validation';
import { handleError, showErrorToast } from '../utils/errorHandler';
import toast from 'react-hot-toast';

interface LocationInputProps {
  locations: Location[];
  onAddLocation: (_location: Omit<Location, 'id'>) => void;
  onRemoveLocation: (_id: string) => void;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Debounced validation
  const debouncedValidation = useCallback(
    debounce((mode: string, data: any) => {
      const errors: string[] = [];
      
      if (mode === 'coordinates' && data.lat && data.lng) {
        const lat = parseFloat(data.lat.replace(',', '.'));
        const lng = parseFloat(data.lng.replace(',', '.'));
        
        if (isNaN(lat) || isNaN(lng)) {
          errors.push('Invalid coordinate format');
        } else if (!validateCoordinates(lat, lng)) {
          errors.push('Coordinates out of valid range');
        }
      } else if (mode === 'utm' && data.easting && data.northing && data.zoneNumber && data.zoneLetter) {
        const easting = parseFloat(data.easting);
        const northing = parseFloat(data.northing);
        const zoneNumber = parseInt(data.zoneNumber, 10);
        
        if (!validateUTM(easting, northing, zoneNumber, data.zoneLetter)) {
          errors.push('Invalid UTM coordinates');
        }
      } else if (mode === 'address' && data.address) {
        if (!validateAddress(data.address)) {
          errors.push('Address must be at least 3 characters long');
        }
      }
      
      setValidationErrors(errors);
    }, 300),
    []
  );

  const handleAddLocation = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      if (inputMode === 'address' && address.trim()) {
        const sanitizedAddress = sanitizeInput(address);
        if (!validateAddress(sanitizedAddress)) {
          throw new Error('Please enter a valid address');
        }

        onAddLocation({
          address: sanitizedAddress,
          lat: 0,
          lng: 0,
        });
        setAddress('');
        toast.success('Location added successfully');
        
      } else if (inputMode === 'coordinates' && coordinates.lat && coordinates.lng) {
        const lat = parseFloat(coordinates.lat.replace(',', '.'));
        const lng = parseFloat(coordinates.lng.replace(',', '.'));

        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Please enter valid numeric coordinates');
        }

        if (!validateCoordinates(lat, lng)) {
          throw new Error('Coordinates must be within valid ranges (lat: -90 to 90, lng: -180 to 180)');
        }

        onAddLocation({
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
        });
        setCoordinates({ lat: '', lng: '' });
        toast.success('Location added successfully');
        
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
        const zoneLetter = utm.zoneLetter.toUpperCase();

        if (isNaN(easting) || isNaN(northing) || isNaN(zoneNumber)) {
          throw new Error('Please enter valid numeric UTM coordinates');
        }

        if (!validateUTM(easting, northing, zoneNumber, zoneLetter)) {
          throw new Error('Please enter valid UTM coordinates');
        }

        try {
          const { lat, lng } = utmConverter.convertUtmToLatLng(
            easting,
            northing,
            zoneNumber,
            zoneLetter as any
          ) as { lat: number; lng: number };

          onAddLocation({
            address: `UTM: ${easting}, ${northing} (${zoneNumber}${zoneLetter})`,
            lat,
            lng,
          });
          setUtm({ easting: '', northing: '', zoneNumber: '', zoneLetter: '' });
          toast.success('Location added successfully');
        } catch (error) {
          throw new Error('Failed to convert UTM coordinates');
        }
      } else {
        throw new Error('Please fill in all required fields');
      }
    } catch (error) {
      const appError = handleError(error);
      showErrorToast(appError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
      toast.error('File size must be less than 1MB');
      return;
    }

    setIsProcessing(true);
    let addedCount = 0;
    let errorCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        data.forEach((row, index) => {
          try {
            if (row.address || (row.lat && row.lng)) {
              const lat = row.lat ? parseFloat(row.lat) : 0;
              const lng = row.lng ? parseFloat(row.lng) : 0;
              
              // Validate coordinates if provided
              if (lat !== 0 && lng !== 0 && !validateCoordinates(lat, lng)) {
                console.warn(`Invalid coordinates in row ${index + 1}: ${lat}, ${lng}`);
                errorCount++;
                return;
              }
              
              const address = row.address ? sanitizeInput(row.address) : `${lat}, ${lng}`;
              
              if (address.length < 3) {
                console.warn(`Invalid address in row ${index + 1}: ${address}`);
                errorCount++;
                return;
              }
              
              onAddLocation({
                address,
                lat: isNaN(lat) ? 0 : lat,
                lng: isNaN(lng) ? 0 : lng,
              });
              addedCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error processing row ${index + 1}:`, error);
            errorCount++;
          }
        });

        setIsProcessing(false);
        
        if (addedCount > 0) {
          toast.success(`Successfully added ${addedCount} locations`);
        }
        
        if (errorCount > 0) {
          toast.error(`Failed to process ${errorCount} rows`);
        }
        
        if (addedCount === 0 && errorCount === 0) {
          toast.error('No valid locations found in the CSV file');
        }
      },
      error: (error) => {
        setIsProcessing(false);
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
    
    // Reset file input
    event.target.value = '';
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isProcessing) {
      handleAddLocation();
    }
  };

  // Trigger validation when inputs change
  React.useEffect(() => {
    if (inputMode === 'coordinates') {
      debouncedValidation('coordinates', coordinates);
    } else if (inputMode === 'utm') {
      debouncedValidation('utm', utm);
    } else if (inputMode === 'address') {
      debouncedValidation('address', { address });
    }
  }, [inputMode, coordinates, utm, address, debouncedValidation]);

  const canAddLocation = () => {
    if (isProcessing || validationErrors.length > 0) return false;
    
    switch (inputMode) {
      case 'address':
        return address.trim().length >= 3;
      case 'coordinates':
        return coordinates.lat && coordinates.lng;
      case 'utm':
        return utm.easting && utm.northing && utm.zoneNumber && utm.zoneLetter;
      default:
        return false;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MapPin className="text-blue-600" size={20} />
        {t('add_locations')}
      </h2>
      
      {/* Input Mode Toggle */}
      <div className="flex mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {[
          { key: 'address', label: t('address') },
          { key: 'coordinates', label: t('coordinates') },
          { key: 'utm', label: t('utm') },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              inputMode === key
                ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
            }`}
            onClick={() => {
              setInputMode(key as any);
              setValidationErrors([]);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-sm text-red-700 dark:text-red-300">
              {validationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      {inputMode === 'address' ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('address')}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={handleAddLocation}
            disabled={!canAddLocation()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-10 flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="loading-spinner w-4 h-4" />
            ) : (
              <Plus size={20} />
            )}
          </button>
        </div>
      ) : inputMode === 'coordinates' ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={coordinates.lat}
            onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
            onKeyPress={handleKeyPress}
            placeholder={t('latitude')}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <input
            type="text"
            value={coordinates.lng}
            onChange={(e) => setCoordinates({ ...coordinates, lng: e.target.value })}
            onKeyPress={handleKeyPress}
            placeholder={t('longitude')}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={handleAddLocation}
            disabled={!canAddLocation()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-10 flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="loading-spinner w-4 h-4" />
            ) : (
              <Plus size={20} />
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input
            type="number"
            value={utm.easting}
            onChange={e => setUtm({ ...utm, easting: e.target.value })}
            placeholder={t('easting')}
            disabled={isProcessing}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <input
            type="number"
            value={utm.northing}
            onChange={e => setUtm({ ...utm, northing: e.target.value })}
            placeholder={t('northing')}
            disabled={isProcessing}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <input
            type="number"
            value={utm.zoneNumber}
            onChange={e => setUtm({ ...utm, zoneNumber: e.target.value })}
            placeholder={t('zone_number')}
            min="1"
            max="60"
            disabled={isProcessing}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <input
            type="text"
            value={utm.zoneLetter}
            onChange={e => setUtm({ ...utm, zoneLetter: e.target.value.toUpperCase() })}
            placeholder={t('zone_letter')}
            maxLength={1}
            disabled={isProcessing}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={handleAddLocation}
            disabled={!canAddLocation()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed col-span-2 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                Processing...
              </>
            ) : (
              <>
                <Plus size={16} />
                {t('add')}
              </>
            )}
          </button>
        </div>
      )}

      {/* File Upload */}
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <Upload size={16} />
          {t('upload_csv')}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('csv_help')}
        </p>
      </div>

      {/* Locations List */}
      {locations.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">
              {t('locations')} ({locations.length})
              {locations.length >= 25 && (
                <span className="text-orange-600 text-sm ml-2">
                  (Maximum recommended: 25)
                </span>
              )}
            </h3>
            <button
              onClick={onClearAll}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm transition-colors"
            >
              {t('clear_all')}
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
            {locations.map((location, index) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {location.address}
                    </span>
                  </div>
                  {location.lat !== 0 && location.lng !== 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveLocation(location.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 transition-colors"
                  title="Remove location"
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