# EcoRoute Frontend

A modern, comprehensive Streamlit application for smart route planning with environmental consciousness.

## Features

### 🔐 Authentication System
- Secure login/logout functionality
- Session state management
- User profile management

### 📊 Dashboard
- Real-time metrics and analytics
- Environmental impact tracking
- Route planning trends
- User statistics and achievements

### 🗺️ Interactive Route Planner
- **Interactive Map**: Click-to-select locations using Folium maps
- **Multi-modal Transportation**: Car, Bike, Public Transport, Walking, Mixed
- **Route Optimization**: Fastest, Shortest, Eco-Friendly, Traffic-Aware
- **Advanced Preferences**: 
  - Avoid tolls/highways
  - Real-time traffic integration
  - Weather considerations
  - Vehicle specifications for eco calculations
- **Environmental Analysis**: CO2 emissions, fuel consumption, eco scoring

### 📜 Route History
- Complete history of planned routes
- Search and filter functionality
- Route analytics and comparisons
- Export capabilities

### ⚙️ Settings
- **Profile Management**: Update personal information
- **Preferences**: Default transportation, route priorities, map styles
- **Notifications**: Email and push notification settings

## Demo Credentials

- **Username**: `demo` | **Password**: `demo123`
- **Username**: `admin` | **Password**: `admin123`
- **Username**: `user` | **Password**: `user123`

## Installation

### Prerequisites
- Python 3.8+
- Backend API running on `http://localhost:8000`

### Quick Start

#### Windows
```bash
# Navigate to frontend directory
cd frontend

# Run the startup script
start.bat
```

#### Linux/Mac
```bash
# Navigate to frontend directory
cd frontend

# Make script executable
chmod +x start.sh

# Run the startup script
./start.sh
```

#### Manual Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Start the application
streamlit run app.py --server.port 8501
```

## Usage

1. **Start the Backend**: Ensure the EcoRoute API is running on port 8000
2. **Launch Frontend**: Run the Streamlit application
3. **Login**: Use demo credentials or create your account
4. **Plan Routes**: Use the interactive map or text inputs
5. **Analyze Impact**: View environmental metrics and suggestions
6. **Track History**: Monitor your route planning trends

## Architecture

### Components
- **Authentication Layer**: Session-based authentication with password hashing
- **Dashboard Module**: Metrics, charts, and user insights
- **Route Planner**: Interactive mapping with Folium integration
- **API Integration**: RESTful communication with backend
- **State Management**: Comprehensive session state handling

### Key Technologies
- **Streamlit**: Modern web app framework
- **Folium**: Interactive mapping
- **Plotly**: Data visualization and charts
- **Pandas**: Data manipulation and analysis
- **Requests**: HTTP client for API communication

## Features Deep Dive

### Interactive Map
- **Folium Integration**: High-quality interactive maps
- **Click-to-Select**: Intuitive location selection
- **Route Visualization**: Real-time route display
- **Multiple Layers**: Traffic, satellite, terrain views

### Environmental Analysis
- **CO2 Tracking**: Real-time emissions calculation
- **Fuel Efficiency**: Smart consumption analysis
- **Eco Scoring**: Environmental impact rating
- **Comparative Analysis**: Route option comparisons

### User Experience
- **Responsive Design**: Works on all screen sizes
- **Modern UI**: Clean, professional interface
- **Real-time Updates**: Live data integration
- **Accessibility**: User-friendly navigation

## API Integration

The frontend communicates with the backend through RESTful APIs:

### Health Check
```http
GET /health
```

### Route Planning
```http
POST /response
Content-Type: application/json

{
  "query": "Find route from New York to Boston using car transportation..."
}
```

## Configuration

### Environment Variables
- `API_BASE_URL`: Backend API URL (default: http://localhost:8000)
- `STREAMLIT_SERVER_PORT`: Frontend port (default: 8501)

### Customization
- **Styling**: Modify CSS in `apply_custom_styling()` function
- **Authentication**: Update user database in `authenticate_user()` function
- **Map Settings**: Configure default locations and zoom levels
- **API Endpoints**: Update URLs in API function calls

## Troubleshooting

### Common Issues

1. **Connection Error**: Ensure backend API is running
2. **Map Not Loading**: Check internet connection for map tiles
3. **Login Issues**: Verify credentials and session state
4. **Slow Performance**: Check API response times

### Debug Mode
```bash
streamlit run app.py --logger.level debug
```

## Development

### Adding New Features
1. Create new functions in appropriate modules
2. Update navigation in sidebar
3. Add new pages to main application logic
4. Test with demo credentials

### Code Structure
```
app.py
├── Authentication (login_page, authenticate_user)
├── Dashboard (dashboard_page, create_metrics_dashboard)
├── Route Planning (route_planner_page, map functions)
├── History (route_history_page)
├── Settings (settings_page)
└── Main Application (main, navigation)
```

## Production Deployment

### Security Considerations
- Implement proper authentication backend
- Use HTTPS for all communications
- Secure API keys and credentials
- Add rate limiting and input validation

### Performance Optimization
- Cache API responses
- Optimize map rendering
- Implement lazy loading
- Add response compression

## Support

For technical support or feature requests, please contact the development team or check the project documentation.

---

**EcoRoute Frontend** - Making sustainable transportation accessible and intelligent.
