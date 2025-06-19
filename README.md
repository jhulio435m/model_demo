# Advanced Route Optimizer Web Application

A comprehensive web application for optimizing routes between multiple locations using advanced algorithms. The system calculates the most efficient route using the Traveling Salesman Problem (TSP) algorithm and displays results on an interactive map with detailed analytics.

## 🚀 Features

### Core Functionality
- **Interactive Web Interface**: Modern React-based frontend with responsive design and dark mode
- **Multiple Input Methods**: Add locations by address, coordinates, UTM coordinates, or CSV file upload
- **Advanced Route Optimization**: Uses OR-Tools to solve TSP with multiple optimization strategies
- **Interactive Maps**: Support for both OpenStreetMap (Leaflet) and Google Maps
- **Real-time Validation**: Input validation with helpful error messages
- **Offline Support**: Works offline with saved routes and local storage

### Route Management
- **Save & Load Routes**: Persistent route storage with tags and descriptions
- **Route Comparison**: Compare multiple route optimizations side-by-side
- **Export Options**: Export results to CSV or PDF formats
- **Route Analytics**: Detailed performance metrics and environmental impact analysis

### Advanced Features
- **Multi-language Support**: English and Spanish translations
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance Optimization**: Lazy loading, code splitting, and optimized rendering
- **Real-time Status**: Backend connectivity and network status indicators

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling with dark mode
- **Leaflet.js** for interactive maps (primary)
- **Google Maps API** for enhanced mapping (optional)
- **i18next** for internationalization
- **Framer Motion** for smooth animations
- **React Hot Toast** for notifications

### Backend
- **Python FastAPI** for high-performance REST API
- **OR-Tools** for advanced TSP optimization algorithms
- **GeoPy** for geocoding and distance calculations
- **Pydantic** for data validation and serialization
- **Uvicorn** as ASGI server with auto-reload

### Development Tools
- **Vite** for fast development and building
- **ESLint** for code quality
- **TypeScript** for type checking
- **PostCSS** with Autoprefixer

## 📁 Project Structure

```
route-optimizer/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── LocationInput.tsx     # Location input with validation
│   │   ├── RouteMap.tsx         # Interactive map component
│   │   ├── RouteResults.tsx     # Results display and export
│   │   ├── RouteSettings.tsx    # Route configuration
│   │   ├── RouteAnalytics.tsx   # Performance analytics
│   │   ├── RouteComparison.tsx  # Route comparison
│   │   └── SavedRoutes.tsx      # Route management
│   ├── services/                # API services
│   │   └── api.ts               # Backend communication
│   ├── utils/                   # Utility functions
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── storage.ts           # Local storage management
│   │   └── validation.ts        # Input validation
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # Type definitions
│   ├── i18n.ts                  # Internationalization setup
│   └── App.tsx                  # Main application component
├── backend/                      # Python FastAPI backend
│   ├── main.py                  # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── test_data/               # Sample data
└── public/                      # Static assets
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.8+** and pip
- Internet connection for map tiles and geocoding

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server**:
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`
   - API documentation: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/health`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your Google Maps API key if desired
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

## 📖 Usage Guide

### Adding Locations

1. **Manual Entry**:
   - **Address**: Enter full addresses (e.g., "123 Main St, New York, NY")
   - **Coordinates**: Enter latitude and longitude (decimal degrees)
   - **UTM**: Enter UTM coordinates with zone information

2. **CSV Upload**:
   - Prepare CSV with columns: `address`, `lat`, `lng`
   - Maximum file size: 1MB
   - Maximum locations: 25 (recommended for optimal performance)

### Route Optimization

1. **Settings Configuration**:
   - **Optimization Goal**: Distance, Time, or Balanced
   - **Vehicle Type**: Car, Truck, Bicycle, or Walking
   - **Starting Location**: Choose specific start point or auto-select
   - **Return to Start**: Option to create round-trip routes

2. **Calculate Route**:
   - Add at least 2 locations
   - Configure settings as needed
   - Click "Calculate Optimal Route"
   - View results on interactive map

### Advanced Features

1. **Route Analytics**:
   - Performance metrics and efficiency scores
   - Environmental impact calculations
   - Segment-by-segment analysis
   - Optimization algorithm details

2. **Route Management**:
   - Save routes with custom names and tags
   - Load previously saved routes
   - Compare multiple route optimizations
   - Export to CSV or PDF formats

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Google Maps API Key (optional)
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Backend API URL (default: http://localhost:8000)
VITE_API_BASE_URL=http://localhost:8000
```

### Google Maps Setup (Optional)

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Add key to `.env` file
4. Restart development server

## 🚀 Production Deployment

### Build Frontend

```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

For production, consider using:
- **Gunicorn** or **Uvicorn** with multiple workers
- **Nginx** as reverse proxy
- **Docker** for containerization
- **Environment variables** for configuration

## 🧪 API Documentation

### Main Endpoints

#### `POST /optimize-route`
Optimize route for multiple locations with advanced options.

**Request**:
```json
{
  "locations": [
    {
      "address": "123 Main St, New York, NY",
      "lat": 40.7128,
      "lng": -74.006
    }
  ],
  "optimization_type": "distance",
  "vehicle_type": "car",
  "return_to_start": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "locations": [...],
    "total_distance": 5420.5,
    "total_time": 391.5,
    "route_order": [0, 2, 1, 3],
    "optimization_stats": {
      "algorithm_used": "OR-Tools TSP",
      "computation_time": 0.45,
      "improvement_percentage": 23.5
    }
  }
}
```

#### `POST /geocode`
Convert address to coordinates.

#### `GET /health`
Backend health check.

## 🔍 Algorithm Details

The application uses advanced optimization algorithms:

1. **TSP Solver**: Google OR-Tools with multiple strategies
2. **Distance Calculation**: Real-world distances using GeoPy
3. **Optimization Strategies**:
   - **Distance**: Minimize total travel distance
   - **Time**: Minimize total travel time
   - **Balanced**: Optimize both distance and time

4. **Performance**: Handles up to 25 locations efficiently

## 🛠 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run preview      # Preview production build
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Error**:
   - Ensure Python backend is running on port 8000
   - Check firewall settings
   - Verify all dependencies are installed

2. **Geocoding Failures**:
   - Check internet connection
   - Verify address format
   - Try using coordinates directly

3. **Map Not Loading**:
   - Check internet connection for tiles
   - Verify Google Maps API key (if using)
   - Check browser console for errors

4. **Performance Issues**:
   - Reduce number of locations (< 25 recommended)
   - Check system resources
   - Clear browser cache

### Error Codes

- **NETWORK_ERROR**: Backend server not accessible
- **TIMEOUT_ERROR**: Request took too long
- **VALIDATION_ERROR**: Invalid input data
- **GEOCODING_ERROR**: Address not found
- **OPTIMIZATION_ERROR**: Route calculation failed

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OR-Tools** for optimization algorithms
- **OpenStreetMap** for map data
- **React** and **TypeScript** communities
- **Tailwind CSS** for styling system

## 📞 Support

For support and questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review [API documentation](#-api-documentation)
3. Check browser console and backend logs
4. Open an issue on GitHub

---

**Built with ❤️ using React, TypeScript, and Python**