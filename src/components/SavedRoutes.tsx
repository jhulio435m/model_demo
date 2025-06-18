import React, { useState, useEffect } from 'react';
import { Save, Folder, Trash2, Edit, Calendar, Tag, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { SavedRoute, OptimizedRoute } from '../types';

interface SavedRoutesProps {
  currentRoute: OptimizedRoute | null;
  onLoadRoute: (route: OptimizedRoute) => void;
}

export const SavedRoutes: React.FC<SavedRoutesProps> = ({ currentRoute, onLoadRoute }) => {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    loadSavedRoutes();
  }, []);

  const loadSavedRoutes = () => {
    const saved = localStorage.getItem('savedRoutes');
    if (saved) {
      setSavedRoutes(JSON.parse(saved));
    }
  };

  const saveRoute = () => {
    if (!currentRoute || !saveForm.name.trim()) {
      toast.error('Please provide a route name');
      return;
    }

    const newRoute: SavedRoute = {
      id: Date.now().toString(),
      name: saveForm.name.trim(),
      description: saveForm.description.trim(),
      route: currentRoute,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: saveForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    const updatedRoutes = [...savedRoutes, newRoute];
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
    
    setSaveForm({ name: '', description: '', tags: '' });
    setIsModalOpen(false);
    toast.success('Route saved successfully!');
  };

  const deleteRoute = (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      const updatedRoutes = savedRoutes.filter(route => route.id !== id);
      setSavedRoutes(updatedRoutes);
      localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
      toast.success('Route deleted');
    }
  };

  const getAllTags = () => {
    const tags = new Set<string>();
    savedRoutes.forEach(route => {
      route.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const filteredRoutes = savedRoutes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => route.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Folder className="text-blue-600" size={24} />
          Saved Routes
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!currentRoute}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={16} />
          Save Current Route
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {getAllTags().length > 0 && (
          <div className="flex flex-wrap gap-2">
            {getAllTags().map(tag => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Tag size={12} className="inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Routes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredRoutes.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Folder size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No saved routes found</p>
            <p className="text-sm mt-2">Save your optimized routes to access them later</p>
          </div>
        ) : (
          filteredRoutes.map(route => (
            <div key={route.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{route.name}</h4>
                  {route.description && (
                    <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onLoadRoute(route.route)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Load route"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteRoute(route.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete route"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(route.created_at), 'MMM dd, yyyy')}
                </span>
                <span>{route.route.locations.length} stops</span>
                <span>{(route.route.total_distance / 1000).toFixed(1)} km</span>
              </div>

              {route.tags && route.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {route.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Save Route Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Route</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Route Name *
                </label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter route name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={saveForm.tags}
                  onChange={(e) => setSaveForm({ ...saveForm, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tags separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., delivery, morning, priority</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveRoute}
                className="flex-1 btn-primary"
              >
                Save Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
