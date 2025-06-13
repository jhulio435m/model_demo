# Route Optimizer Web Application

A complete web application for optimizing routes between multiple locations. The system calculates the most efficient route using the Traveling Salesman Problem (TSP) algorithm and displays results on an interactive map.

## Features

- **Interactive Web Interface**: Modern React-based frontend with responsive design
- **Multiple Input Methods**: Add locations by address, coordinates, or CSV file upload
- **Route Optimization**: Uses OR-Tools to solve TSP and find the optimal route
- **Interactive Map**: Leaflet.js map with numbered markers and route visualization
- **Export Options**: Export results to CSV or PDF formats
- **Real-time Geocoding**: Automatic address-to-coordinates conversion
- **Distance & Time Estimation**: Calculates total distance and estimated travel time

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Leaflet.js** for interactive maps
- **Axios** for API communication
- **Papa Parse** for CSV handling
- **html2pdf.js** for PDF export

### Backend
- **Python FastAPI** for REST API
- **OR-Tools** for TSP optimization
- **GeoPy** for geocoding and distance calculations
- **Pydantic** for data validation
- **Uvicorn** as ASGI server

## Project Structure

```
route-optimizer/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── LocationInput.tsx     # Location input form
│   │   ├── RouteMap.tsx         # Interactive map component
│   │   └── RouteResults.tsx     # Results display and export
│   ├── services/
│   │   └── api.ts               # API service layer
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   └── App.tsx                  # Main application component
├── backend/                      # Python FastAPI backend
│   ├── main.py                  # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── test_data/
│       └── sample_locations.csv # Sample data for testing
├── package.json                 # Frontend dependencies
└── README.md                    # This file
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- pip (Python package manager)

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

2. **Start the development server**:
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## Usage

### Adding Locations

1. **Manual Entry**:
   - Switch between "Address" and "Coordinates" input modes
   - Enter addresses (e.g., "123 Main St, New York, NY") or coordinates
   - Click the "+" button to add each location

2. **CSV Upload**:
   - Prepare a CSV file with columns: `address`, `lat`, `lng`
   - Use the "Upload CSV file" option
   - See `backend/test_data/sample_locations.csv` for format example

### Calculating Routes

1. Add at least 2 locations
2. Click "Calculate Optimal Route"
3. View results on the interactive map
4. Check the route summary with distance and time estimates

### Exporting Results

- **CSV Export**: Download route order with coordinates
- **PDF Export**: Generate PDF with route summary and details

## API Endpoints

### `POST /optimize-route`
Optimize route for multiple locations.

**Request Body**:
```json
{
  "locations": [
    {
      "address": "123 Main St, New York, NY",
      "lat": 40.7128,
      "lng": -74.0060
    }
  ]
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
    "route_order": [0, 2, 1, 3]
  }
}
```

### `POST /geocode`
Convert address to coordinates.

**Request Body**:
```json
{
  "address": "123 Main St, New York, NY"
}
```

### `GET /health`
Health check endpoint.

## Algorithm Details

The application uses the **Traveling Salesman Problem (TSP)** algorithm implemented with Google's OR-Tools:

1. **Distance Matrix Calculation**: Uses GeoPy to calculate real-world distances between all location pairs
2. **TSP Optimization**: OR-Tools solver finds the shortest route visiting all locations exactly once
3. **Heuristics**: Uses PATH_CHEAPEST_ARC with Guided Local Search for optimization
4. **Time Estimation**: Estimates travel time based on average speed of 50 km/h

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development
```bash
python main.py       # Start with auto-reload
```

### Adding New Features

1. **Frontend**: Add components in `src/components/`
2. **Backend**: Extend API endpoints in `backend/main.py`
3. **Types**: Update TypeScript definitions in `src/types/`

## Troubleshooting

### Common Issues

1. **Backend Connection Error**:
   - Ensure Python backend is running on port 8000
   - Check that all Python dependencies are installed
   - Verify CORS settings allow frontend origin

2. **Geocoding Failures**:
   - Check internet connection for Nominatim API access
   - Verify address format is complete and accurate
   - Try using coordinates directly if geocoding fails

3. **Route Optimization Timeout**:
   - Reduce number of locations (recommended: < 20 for optimal performance)
   - Check that all coordinates are valid

4. **Map Not Loading**:
   - Ensure internet connection for OpenStreetMap tiles
   - Check browser console for JavaScript errors

## Performance Considerations

- **Location Limit**: Optimal performance with < 20 locations
- **Geocoding**: Cached results improve performance for repeated addresses
- **TSP Complexity**: Algorithm complexity is O(n²) for distance matrix, O(n!) for TSP
- **Memory Usage**: Large location sets may require increased memory allocation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate tests
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at `http://localhost:8000/docs`
3. Check browser console and backend logs for error details
