# Quick Start

This guide summarizes how to run the Route Optimizer application.

## Backend

1. **Install Python dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. **Run the API**
   ```bash
   python main.py
   ```
   The API will be available at <http://localhost:8000>.

## Frontend

1. **Install Node dependencies**
   ```bash
   npm install
   ```
2. **Start the development server**
   ```bash
   npm run dev
   ```
   Open <http://localhost:5173> in your browser.

## Building for Production

To generate a production build of the frontend:
```bash
npm run build
```
The built files are output to the `dist` directory.
