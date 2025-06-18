import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      add_locations: 'Add Locations',
      address: 'Address',
      coordinates: 'Coordinates',
      utm: 'UTM',
      latitude: 'Latitude',
      longitude: 'Longitude',
      easting: 'Easting',
      northing: 'Northing',
      zone_number: 'Zone Number',
      zone_letter: 'Zone Letter',
      add: 'Add',
      upload_csv: 'Upload CSV file',
      csv_help: 'CSV should have columns: address, lat, lng',
      locations: 'Locations',
      clear_all: 'Clear All',
      route_settings: 'Route Settings',
      route_planning: 'Route Planning',
      analytics: 'Analytics',
      comparison: 'Comparison',
      saved_routes: 'Saved Routes',
      route_map: 'Route Map',
      calculate_route: 'Calculate Optimal Route',
      route_optimizer_title: 'Advanced Route Optimizer',
      subtitle: 'Intelligent route planning with analytics and optimization',
      at_least_two: 'Add at least 2 locations to calculate route',
      error: 'Error',
      language: 'Language',
      optimization_goal: 'Optimization Goal',
      vehicle_type: 'Vehicle Type',
      starting_location: 'Starting Location',
      return_to_start: 'Return to Starting Point'
    }
  },
  es: {
    translation: {
      add_locations: 'Agregar Ubicaciones',
      address: 'Dirección',
      coordinates: 'Coordenadas',
      utm: 'UTM',
      latitude: 'Latitud',
      longitude: 'Longitud',
      easting: 'Este',
      northing: 'Norte',
      zone_number: 'Número de Zona',
      zone_letter: 'Letra de Zona',
      add: 'Agregar',
      upload_csv: 'Subir archivo CSV',
      csv_help: 'El CSV debe tener columnas: address, lat, lng',
      locations: 'Ubicaciones',
      clear_all: 'Borrar Todo',
      route_settings: 'Configuración de Ruta',
      route_planning: 'Planificación',
      analytics: 'Analítica',
      comparison: 'Comparación',
      saved_routes: 'Guardadas',
      route_map: 'Mapa de Ruta',
      calculate_route: 'Calcular Ruta Óptima',
      route_optimizer_title: 'Optimizador de Rutas',
      subtitle: 'Planificación inteligente con análisis y optimización',
      at_least_two: 'Agrega al menos 2 ubicaciones para calcular la ruta',
      error: 'Error',
      language: 'Idioma',
      optimization_goal: 'Objetivo de Optimización',
      vehicle_type: 'Tipo de Vehículo',
      starting_location: 'Ubicación Inicial',
      return_to_start: 'Volver al Inicio'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
