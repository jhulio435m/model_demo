import { SavedRoute, OptimizedRoute } from '../types';

const STORAGE_KEYS = {
  SAVED_ROUTES: 'savedRoutes',
  ROUTE_SETTINGS: 'routeSettings',
  USER_PREFERENCES: 'userPreferences',
  LANGUAGE: 'lang',
  DARK_MODE: 'darkMode',
} as const;

export const storage = {
  // Saved Routes
  getSavedRoutes(): SavedRoute[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_ROUTES);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved routes:', error);
      return [];
    }
  },

  saveSavedRoutes(routes: SavedRoute[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_ROUTES, JSON.stringify(routes));
    } catch (error) {
      console.error('Error saving routes:', error);
      throw new Error('Failed to save routes to local storage');
    }
  },

  addSavedRoute(route: SavedRoute): void {
    const routes = this.getSavedRoutes();
    routes.push(route);
    this.saveSavedRoutes(routes);
  },

  deleteSavedRoute(id: string): void {
    const routes = this.getSavedRoutes().filter(route => route.id !== id);
    this.saveSavedRoutes(routes);
  },

  updateSavedRoute(id: string, updates: Partial<SavedRoute>): void {
    const routes = this.getSavedRoutes();
    const index = routes.findIndex(route => route.id === id);
    if (index !== -1) {
      routes[index] = { ...routes[index], ...updates, updated_at: new Date().toISOString() };
      this.saveSavedRoutes(routes);
    }
  },

  // Route Settings
  getRouteSettings(): any {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROUTE_SETTINGS);
      return saved ? JSON.parse(saved) : {
        optimization_type: 'distance',
        vehicle_type: 'car',
        return_to_start: false,
      };
    } catch (error) {
      console.error('Error loading route settings:', error);
      return {
        optimization_type: 'distance',
        vehicle_type: 'car',
        return_to_start: false,
      };
    }
  },

  saveRouteSettings(settings: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ROUTE_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving route settings:', error);
    }
  },

  // User Preferences
  getUserPreferences(): any {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return {};
    }
  },

  saveUserPreferences(preferences: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  },

  // Language
  getLanguage(): string {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'es';
  },

  saveLanguage(language: string): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  },

  // Dark Mode
  getDarkMode(): boolean {
    const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    return stored
      ? stored === 'true'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  saveDarkMode(darkMode: boolean): void {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, darkMode.toString());
  },

  // Clear all data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};