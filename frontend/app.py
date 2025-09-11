import streamlit as st
import folium
from streamlit_folium import st_folium
import requests
import json
import time
import pandas as pd
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
import numpy as np
from dotenv import load_dotenv,find_dotenv

load_dotenv(find_dotenv(filename=".env"))

# Page configuration
st.set_page_config(
    page_title="EcoRoute - Smart Route Planning",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client (with error handling for demo)
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except:
    supabase = None
    st.warning("⚠️ Supabase not configured. Using demo mode.")

# Initialize geocoder
@st.cache_resource
def get_geocoder():
    return Nominatim(user_agent="ecoroute")

geocoder = get_geocoder()

# Session state initialization
def init_session_state():
    """Initialize all session state variables"""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'user' not in st.session_state:
        st.session_state.user = None
    if 'current_page' not in st.session_state:
        st.session_state.current_page = "dashboard"
    if 'route_history' not in st.session_state:
        st.session_state.route_history = []
    if 'current_route' not in st.session_state:
        st.session_state.current_route = None
    if 'map_center' not in st.session_state:
        st.session_state.map_center = [40.7128, -74.0060]  # NYC default

# Authentication functions
def sign_up_user(email, password, full_name):
    """Sign up a new user with Supabase"""
    if not supabase:
        # Demo mode
        st.session_state.authenticated = True
        st.session_state.user = {
            'email': email,
            'user_metadata': {'full_name': full_name},
            'id': 'demo_user'
        }
        return True, "Account created successfully!"
    
    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name
                }
            }
        })
        
        if response.user:
            st.session_state.authenticated = True
            st.session_state.user = response.user
            return True, "Account created successfully! Please check your email to verify your account."
        else:
            return False, "Failed to create account. Please try again."
    
    except Exception as e:
        return False, f"Error: {str(e)}"

def sign_in_user(email, password):
    """Sign in user with Supabase"""
    if not supabase:
        # Demo mode
        if email == "demo@ecoroute.com" and password == "demo123":
            st.session_state.authenticated = True
            st.session_state.user = {
                'email': email,
                'user_metadata': {'full_name': 'Demo User'},
                'id': 'demo_user'
            }
            return True, "Signed in successfully!"
        else:
            return False, "Invalid credentials"
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if response.user:
            st.session_state.authenticated = True
            st.session_state.user = response.user
            return True, "Signed in successfully!"
        else:
            return False, "Invalid email or password"
    
    except Exception as e:
        return False, f"Error: {str(e)}"

def sign_out_user():
    """Sign out current user"""
    if supabase:
        try:
            supabase.auth.sign_out()
        except:
            pass
    
    st.session_state.authenticated = False
    st.session_state.user = None
    st.session_state.route_history = []
    st.session_state.current_route = None
    st.rerun()

# Helper function to safely get user information
def get_user_name():
    """Safely extract user name from session state"""
    if not st.session_state.user:
        return "User"
    
    # If user is a dictionary (demo/fallback mode)
    if isinstance(st.session_state.user, dict):
        return st.session_state.user.get('user_metadata', {}).get('full_name', 'User')
    
    # If user is a Supabase User object (Pydantic model)
    try:
        if hasattr(st.session_state.user, 'user_metadata') and st.session_state.user.user_metadata:
            return st.session_state.user.user_metadata.get('full_name', 'User')
        elif hasattr(st.session_state.user, 'email'):
            # Fallback to email prefix if no full name
            email = st.session_state.user.email
            return email.split('@')[0].title() if email else 'User'
        else:
            return 'User'
    except:
        return 'User'

# API Integration functions
def call_ecoroute_api(query):
    """
    Call the EcoRoute API with async support and progress tracking
    
    Args:
        query (str): The route query string
    
    Returns:
        dict: API response with success/error information
    """
    try:
        api_url = "http://localhost:8000"
        
        # Try async endpoint first (recommended)
        async_response = requests.post(
            f"{api_url}/route/analyze",
            json={"query": query},
            timeout=10  # Quick timeout for job submission
        )
        
        if async_response.status_code == 200:
            job_data = async_response.json()
            job_id = job_data["job_id"]
            
            # Show progress tracking
            progress_placeholder = st.empty()
            
            with progress_placeholder.container():
                progress_bar = st.progress(0)
                st.write("🚀 **Starting AI route analysis...**")
            
            # Poll for results
            max_wait_time = 120  # 2 minutes max
            poll_interval = 2    # Check every 2 seconds
            start_time = time.time()
            
            while time.time() - start_time < max_wait_time:
                try:
                    status_response = requests.get(
                        f"{api_url}/route/status/{job_id}",
                        timeout=5
                    )
                    
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        
                        # Update progress
                        progress = status_data.get("progress", 0.0)
                        elapsed_time = status_data.get("elapsed_time", 0)
                        
                        with progress_placeholder.container():
                            progress_bar.progress(progress)
                            
                            if status_data["status"] == "pending":
                                st.write("⏳ **Analysis queued... Please wait**")
                            elif status_data["status"] == "processing":
                                st.write(f"🧠 **AI agents are analyzing your route... ({elapsed_time:.0f}s)**")
                            
                        # Check if completed
                        if status_data["status"] == "completed":
                            progress_placeholder.empty()
                            return {
                                "success": True,
                                "data": {"response": status_data["result"]},
                                "job_id": job_id,
                                "elapsed_time": elapsed_time,
                                "error": None
                            }
                        elif status_data["status"] == "failed":
                            progress_placeholder.empty()
                            return {
                                "success": False,
                                "data": None,
                                "error": f"Analysis failed: {status_data.get('error', 'Unknown error')}",
                                "job_id": job_id
                            }
                    
                    time.sleep(poll_interval)
                    
                except requests.exceptions.RequestException:
                    # If status check fails, continue waiting
                    time.sleep(poll_interval)
                    continue
            
            # Timeout
            progress_placeholder.empty()
            return {
                "success": False,
                "data": None,
                "error": f"Analysis timed out after {max_wait_time} seconds. The job may still be processing in the background.",
                "job_id": job_id,
                "timeout": True
            }
        
        else:
            # Fall back to synchronous endpoint
            st.warning("🔄 **Falling back to synchronous processing...**")
            
            sync_response = requests.post(
                f"{api_url}/response",
                json={"query": query},
                timeout=60  # Longer timeout for sync
            )
            
            if sync_response.status_code == 200:
                return {
                    "success": True,
                    "data": sync_response.json(),
                    "sync": True,
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "data": None,
                    "error": f"API Error: {sync_response.status_code} - {sync_response.text}"
                }
    
    except requests.exceptions.Timeout:
        return {
            "success": False,
            "data": None,
            "error": "Request timed out. The AI analysis is taking longer than expected. Please try again or check if the backend service is running properly.",
            "timeout": True
        }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "data": None,
            "error": "Could not connect to EcoRoute API. Please ensure the backend service is running on http://localhost:8000",
            "connection_error": True
        }
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": f"Unexpected error: {str(e)}"
        }

def check_api_health():
    """Check if the EcoRoute API is available"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def create_route_query(source, destination, transport_mode, route_priority, additional_params=None):
    """Create a comprehensive query for the EcoRoute API"""
    
    # Base query structure
    query = f"""
Please analyze and plan an eco-friendly route with the following specifications:

**Route Details:**
- From: {source}
- To: {destination}
- Transportation Mode: {transport_mode}
- Route Priority: {route_priority}

**Analysis Requirements:**
1. Find the optimal route considering environmental impact
2. Provide detailed route information including:
   - Total distance and estimated travel time
   - Step-by-step directions
   - Environmental impact analysis (CO2 emissions, fuel consumption)
   - Eco-score rating (0-100)
   - Alternative route options if available

3. Consider factors such as:
   - Real-time traffic conditions
   - Road types and conditions
   - Elevation changes
   - Weather impact
   - Vehicle efficiency (if applicable)

4. Provide recommendations for:
   - Most eco-friendly route option
   - Potential improvements or alternatives
   - Environmental benefits compared to other routes

**Transportation Specific Analysis:**"""

    # Add transport-specific parameters
    if transport_mode.lower() == "car":
        query += """
- Fuel efficiency optimization
- Traffic congestion avoidance
- Highway vs local road trade-offs
- Parking considerations at destination"""
    
    elif transport_mode.lower() == "bike":
        query += """
- Bike-friendly routes and bike lanes
- Elevation and terrain analysis
- Safety considerations
- Weather impact on cycling"""
    
    elif transport_mode.lower() == "public transport":
        query += """
- Public transit schedules and connections
- Walking distances to/from stations
- Cost analysis
- Carbon footprint of public transport"""
    
    elif transport_mode.lower() == "walking":
        query += """
- Pedestrian-friendly paths
- Safety and lighting considerations
- Scenic route options
- Weather protection availability"""

    # Add additional parameters if provided
    if additional_params:
        query += f"\n\n**Additional Preferences:**\n"
        for key, value in additional_params.items():
            if value:
                query += f"- {key}: {value}\n"

    query += f"""

**Expected Response Format:**
Please provide a comprehensive analysis including route details, environmental metrics, and actionable recommendations. Focus on both practical routing and environmental consciousness."""

    return query.strip()

def parse_api_response(api_response):
    """Parse and extract useful information from API response"""
    if not api_response or not api_response.get("success"):
        return None
    
    response_text = api_response["data"].get("response", "")
    
    # For now, return the raw response text
    # In a more sophisticated implementation, you could parse specific metrics
    return {
        "raw_response": response_text,
        "analysis_complete": True,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
@st.cache_data(ttl=3600)  # Cache for 1 hour
def geocode_address(address):
    """Geocode an address to coordinates"""
    try:
        location = geocoder.geocode(address, timeout=10)
        if location:
            return location.latitude, location.longitude
        return None, None
    except:
        return None, None

def reverse_geocode(lat, lon):
    """Reverse geocode coordinates to address"""
    try:
        location = geocoder.reverse(f"{lat}, {lon}", timeout=10)
        if location:
            return location.address
        return f"{lat:.4f}, {lon:.4f}"
    except:
        return f"{lat:.4f}, {lon:.4f}"

# Route calculation functions
def calculate_route_distance(source_coords, dest_coords):
    """Calculate distance between two points"""
    if source_coords and dest_coords:
        return geodesic(source_coords, dest_coords).kilometers
    return 0

def generate_route_points(source_coords, dest_coords, num_points=10):
    """Generate intermediate points for route visualization"""
    if not source_coords or not dest_coords:
        return []
    
    lat_diff = (dest_coords[0] - source_coords[0]) / num_points
    lon_diff = (dest_coords[1] - source_coords[1]) / num_points
    
    points = []
    for i in range(num_points + 1):
        lat = source_coords[0] + (lat_diff * i)
        lon = source_coords[1] + (lon_diff * i)
        points.append([lat, lon])
    
    return points

def calculate_environmental_impact(distance, transport_mode):
    """Calculate environmental impact metrics"""
    # CO2 emissions in kg per km
    emission_factors = {
        "Car": 0.2,
        "Bike": 0.0,
        "Public Transport": 0.08,
        "Walking": 0.0,
        "Mixed": 0.1
    }
    
    factor = emission_factors.get(transport_mode, 0.2)
    co2_emissions = distance * factor
    
    return {
        "distance": round(distance, 2),
        "co2_emissions": round(co2_emissions, 2),
        "fuel_saved": round(distance * 0.08, 2) if transport_mode != "Car" else 0,
        "eco_score": max(0, 100 - int(co2_emissions * 5))
    }

# Map functions
def create_map(center=None, zoom=10):
    """Create a folium map"""
    if center is None:
        center = st.session_state.map_center
    
    m = folium.Map(
        location=center,
        zoom_start=zoom,
        tiles="OpenStreetMap"
    )
    return m

def add_route_to_map(m, source_coords, dest_coords, route_points=None):
    """Add route markers and path to map"""
    if source_coords:
        folium.Marker(
            location=source_coords,
            popup="📍 Start",
            tooltip="Starting Point",
            icon=folium.Icon(color='green', icon='play', prefix='fa')
        ).add_to(m)
    
    if dest_coords:
        folium.Marker(
            location=dest_coords,
            popup="🎯 Destination",
            tooltip="Destination",
            icon=folium.Icon(color='red', icon='stop', prefix='fa')
        ).add_to(m)
    
    if route_points and len(route_points) > 1:
        folium.PolyLine(
            locations=route_points,
            weight=4,
            color='#2E86AB',
            opacity=0.8,
            popup="Recommended Route"
        ).add_to(m)
    
    return m

# Authentication pages
def auth_page():
    """Authentication page with sign in and sign up"""
    st.title("🌱 EcoRoute")
    st.subheader("Smart Route Planning for Sustainable Travel")
    
    tab1, tab2 = st.tabs(["Sign In", "Sign Up"])
    
    with tab1:
        with st.form("signin_form"):
            st.subheader("Welcome Back")
            email = st.text_input("Email Address", placeholder="your@email.com")
            password = st.text_input("Password", type="password")
            
            col1, col2 = st.columns(2)
            with col1:
                sign_in_btn = st.form_submit_button("Sign In", use_container_width=True)
            
            if sign_in_btn and email and password:
                with st.spinner("Signing in..."):
                    success, message = sign_in_user(email, password)
                
                if success:
                    st.success(message)
                    st.rerun()
                else:
                    st.error(message)
        
        # Demo credentials info
        st.info("**Demo Account**: demo@ecoroute.com / demo123")
    
    with tab2:
        with st.form("signup_form"):
            st.subheader("Create Account")
            full_name = st.text_input("Full Name", placeholder="John Doe")
            email = st.text_input("Email Address", placeholder="your@email.com")
            password = st.text_input("Password", type="password")
            confirm_password = st.text_input("Confirm Password", type="password")
            
            agree_terms = st.checkbox("I agree to the Terms of Service and Privacy Policy")
            
            sign_up_btn = st.form_submit_button("Create Account", use_container_width=True)
            
            if sign_up_btn:
                if not all([full_name, email, password, confirm_password]):
                    st.error("Please fill in all fields")
                elif password != confirm_password:
                    st.error("Passwords do not match")
                elif len(password) < 6:
                    st.error("Password must be at least 6 characters long")
                elif not agree_terms:
                    st.error("Please agree to the terms and conditions")
                else:
                    with st.spinner("Creating account..."):
                        success, message = sign_up_user(email, password, full_name)
                    
                    if success:
                        st.success(message)
                        if not supabase:  # Demo mode - auto login
                            st.rerun()
                    else:
                        st.error(message)

# Main application pages
def dashboard_page():
    """AI-powered dashboard with comprehensive metrics"""
    st.title("📊 EcoRoute Dashboard")
    
    user_name = get_user_name()
    st.write(f"Welcome back, **{user_name}**! 👋")
    
    # API Status Check
    api_status = check_api_health()
    if api_status:
        st.success("🟢 **AI Route Planning Service: Online**")
    else:
        st.error("🔴 **AI Route Planning Service: Offline**")
        st.info("💡 Start the backend service to enable intelligent route analysis")
    
    # Key Metrics Row
    st.markdown("### 📈 **Your EcoRoute Impact**")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_routes = len(st.session_state.route_history)
        st.metric(
            label="�️ Routes Analyzed",
            value=total_routes,
            delta=f"+{min(total_routes, 3)} this session" if total_routes > 0 else None
        )
    
    with col2:
        # Calculate AI analyses
        ai_analyses = sum(1 for route in st.session_state.route_history if 'ai_analysis' in route)
        st.metric(
            label="🤖 AI Analyses",
            value=ai_analyses,
            delta=f"{ai_analyses}/{total_routes} routes" if total_routes > 0 else None
        )
    
    with col3:
        # Estimate environmental impact (placeholder calculation)
        estimated_co2_saved = total_routes * 2.5  # Rough estimate
        st.metric(
            label="🌱 Est. CO₂ Saved",
            value=f"{estimated_co2_saved:.1f} kg",
            delta="vs. non-optimized routes"
        )
    
    with col4:
        # Calculate transportation diversity
        transport_modes = set(route.get('transport_mode', 'Unknown') for route in st.session_state.route_history)
        st.metric(
            label="� Transport Modes",
            value=len(transport_modes),
            delta="variety explored"
        )
    
    # Recent Activity & Charts
    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        st.markdown("### 📊 **Route Planning Activity**")
        
        if st.session_state.route_history:
            # Create a simple activity chart
            route_data = []
            transport_counts = {}
            priority_counts = {}
            
            for route in st.session_state.route_history:
                transport = route.get('transport_mode', 'Unknown')
                priority = route.get('route_priority', 'Unknown')
                
                transport_counts[transport] = transport_counts.get(transport, 0) + 1
                priority_counts[priority] = priority_counts.get(priority, 0) + 1
            
            # Transportation mode distribution
            if transport_counts:
                st.markdown("#### 🚗 **Transportation Preferences**")
                for mode, count in transport_counts.items():
                    percentage = (count / total_routes) * 100
                    st.progress(percentage/100, text=f"{mode}: {count} routes ({percentage:.1f}%)")
            
            # Route priority distribution
            if priority_counts:
                st.markdown("#### 🎯 **Route Priorities**")
                for priority, count in priority_counts.items():
                    percentage = (count / total_routes) * 100
                    st.progress(percentage/100, text=f"{priority}: {count} routes ({percentage:.1f}%)")
        
        else:
            st.info("📈 **Your activity charts will appear here once you start planning routes!**")
            
            # Show sample visualization
            st.markdown("**Sample Benefits of AI Route Planning:**")
            sample_data = pd.DataFrame({
                'Metric': ['Time Saved', 'CO₂ Reduced', 'Fuel Saved', 'Cost Saved'],
                'Improvement': [15, 23, 18, 12],
                'Unit': ['%', '%', '%', '%']
            })
            
            st.bar_chart(sample_data.set_index('Metric')['Improvement'])
    
    with col_right:
        st.markdown("### 🔥 **Recent Activity**")
        
        if st.session_state.route_history:
            # Show last 5 routes
            recent_routes = st.session_state.route_history[-5:]
            
            for i, route in enumerate(reversed(recent_routes)):
                with st.container():
                    st.markdown(f"""
                    **🗺️ {route.get('source', 'Unknown')[:20]}... → {route.get('destination', 'Unknown')[:20]}...**  
                    🚗 {route.get('transport_mode', 'Unknown')} | 🎯 {route.get('route_priority', 'Unknown')}  
                    📅 {route.get('timestamp', 'Unknown')}
                    """)
                    
                    if 'ai_analysis' in route:
                        st.caption("✅ AI Analysis Complete")
                    else:
                        st.caption("⏳ Analysis Pending")
                    
                    if st.button(f"👁️ View Details", key=f"recent_{i}"):
                        st.session_state.current_route = route
                        st.session_state.current_page = "route_planner"
                        st.rerun()
                
                st.divider()
        
        else:
            st.info("🕐 **Recent routes will appear here**")
            
            # Quick start buttons
            st.markdown("### 🚀 **Quick Start**")
            
            if st.button("🗺️ Plan Route", use_container_width=True, type="primary"):
                st.session_state.current_page = "route_planner"
                st.rerun()
            
            if st.button("📖 View History", use_container_width=True):
                st.session_state.current_page = "route_history"
                st.rerun()
    
    # AI Insights Section
    st.markdown("### 🧠 **AI Insights & Recommendations**")
    
    if st.session_state.route_history:
        # Generate insights based on user's route history
        most_used_transport = max(
            set(route.get('transport_mode', 'Car') for route in st.session_state.route_history),
            key=lambda x: sum(1 for route in st.session_state.route_history if route.get('transport_mode') == x)
        )
        
        most_used_priority = max(
            set(route.get('route_priority', 'Fastest') for route in st.session_state.route_history),
            key=lambda x: sum(1 for route in st.session_state.route_history if route.get('route_priority') == x)
        )
        
        col_insight1, col_insight2 = st.columns(2)
        
        with col_insight1:
            st.info(f"""
            **🚗 Transportation Pattern**  
            You prefer **{most_used_transport}** transportation. Consider exploring other eco-friendly options like biking or public transport for shorter routes!
            """)
        
        with col_insight2:
            st.info(f"""
            **🎯 Route Preference**  
            You typically prioritize **{most_used_priority}** routes. Try 'Eco-Friendly' priority to maximize environmental benefits!
            """)
        
        # Environmental impact summary
        if len(st.session_state.route_history) >= 3:
            st.success(f"""
            **🌱 Environmental Impact**  
            Great job! You've planned {len(st.session_state.route_history)} routes with our AI system. 
            This smart approach to route planning helps reduce environmental impact and promotes sustainable transportation choices.
            """)
    
    else:
        # Onboarding insights
        st.info("""
        **🎯 Get Started with AI Route Planning**  
        
        Our intelligent system uses three specialized AI agents:
        - **🔍 Route Planner Agent**: Finds optimal route options
        - **🌐 Research Agent**: Analyzes traffic, weather, and environmental factors  
        - **💡 Suggestion Agent**: Provides personalized eco-friendly recommendations
        
        Start planning your first route to unlock personalized insights!
        """)
    
    # Settings and Quick Actions
    st.markdown("### ⚙️ **Quick Actions**")
    col_action1, col_action2, col_action3 = st.columns(3)
    
    with col_action1:
        if st.button("� Refresh Data", use_container_width=True):
            st.rerun()
    
    with col_action2:
        if st.button("📊 Export Data", use_container_width=True):
            if st.session_state.route_history:
                export_data = {
                    "user": user_name,
                    "total_routes": len(st.session_state.route_history),
                    "export_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "routes": st.session_state.route_history
                }
                export_text = json.dumps(export_data, indent=2)
                st.download_button(
                    "💾 Download Dashboard Data",
                    data=export_text,
                    file_name="ecoroute_dashboard.json",
                    mime="application/json"
                )
            else:
                st.info("No data to export yet!")
    
    with col_action3:
        if st.button("🏠 Reset Session", use_container_width=True, type="secondary"):
            if st.button("⚠️ Confirm Reset", type="secondary"):
                st.session_state.route_history = []
                st.session_state.current_route = None
                st.success("Session reset successfully!")
                st.rerun()

def route_planner_page():
    """Intelligent route planning interface with API integration"""
    st.title("🗺️ Route Planner")
    
    # Check API status
    api_status = check_api_health()
    if not api_status:
        st.error("🚨 **EcoRoute API Unavailable**")
        st.error("The intelligent route planning service is currently unavailable. Please ensure the backend server is running.")
        st.info("💡 **To start the backend:**\n```bash\ncd backend\npython api.py\n```")
        return
    else:
        st.success("🟢 **EcoRoute API Connected** - Intelligent route planning ready!")
    
    col1, col2 = st.columns([1, 2])
    
    with col1:
        st.subheader("Plan Your Intelligent Route")
        
        # Route input form
        with st.form("route_planning_form"):
            st.markdown("#### 📍 **Route Details**")
            source = st.text_input(
                "From",
                placeholder="Enter starting location (e.g., Times Square, New York)",
                help="Enter a specific address, landmark, or place name"
            )
            
            destination = st.text_input(
                "To", 
                placeholder="Enter destination (e.g., Central Park, New York)",
                help="Enter a specific address, landmark, or place name"
            )
            
            st.markdown("#### 🚗 **Transportation & Preferences**")
            col_a, col_b = st.columns(2)
            
            with col_a:
                transport_mode = st.selectbox(
                    "Transportation Mode",
                    ["Car", "Bike", "Public Transport", "Walking", "Mixed"],
                    help="Select your preferred mode of transportation"
                )
            
            with col_b:
                route_priority = st.selectbox(
                    "Route Priority",
                    ["Eco-Friendly", "Fastest", "Shortest", "Scenic", "Safest"],
                    help="Choose what to optimize for"
                )
            
            # Advanced options
            with st.expander("⚙️ **Advanced Options**", expanded=False):
                st.markdown("**Route Preferences:**")
                avoid_tolls = st.checkbox("Avoid toll roads")
                avoid_highways = st.checkbox("Avoid highways") 
                avoid_traffic = st.checkbox("Avoid heavy traffic", value=True)
                
                if transport_mode == "Car":
                    st.markdown("**Vehicle Information:**")
                    fuel_type = st.selectbox("Fuel Type", ["Gasoline", "Diesel", "Electric", "Hybrid"])
                    vehicle_efficiency = st.slider("Fuel Efficiency (mpg)", 15, 50, 25)
                
                st.markdown("**Environmental Considerations:**")
                prioritize_eco = st.checkbox("Prioritize environmental impact", value=True)
                consider_weather = st.checkbox("Consider weather conditions", value=True)
            
            # Submit button
            plan_route_btn = st.form_submit_button(
                "🧠 Analyze Route with AI",
                use_container_width=True,
                type="primary",
                help="Use our intelligent AI agents to plan the optimal eco-friendly route"
            )
        
        # Process route planning
        if plan_route_btn and source and destination:
            # Create additional parameters
            additional_params = {
                "avoid_tolls": avoid_tolls,
                "avoid_highways": avoid_highways,
                "avoid_traffic": avoid_traffic,
                "prioritize_eco": prioritize_eco,
                "consider_weather": consider_weather
            }
            
            # Add vehicle-specific params if car is selected
            if transport_mode == "Car":
                additional_params.update({
                    "fuel_type": fuel_type,
                    "vehicle_efficiency": f"{vehicle_efficiency} mpg"
                })
            
            # Create comprehensive query for the AI agents
            query = create_route_query(source, destination, transport_mode, route_priority, additional_params)
            
            st.markdown("### 🔄 **AI Analysis in Progress**")
            with st.status("Analyzing route with AI agents...", expanded=True) as status:
                st.write("🔍 **Route Planner Agent**: Finding optimal route options...")
                st.write("🌐 **Research Agent**: Analyzing traffic, weather, and environmental factors...")
                st.write("💡 **Suggestion Agent**: Generating personalized recommendations...")
                
                # Call the API
                api_result = call_ecoroute_api(query)
                
                if api_result["success"]:
                    status.update(label="✅ **Analysis Complete!**", state="complete")
                    
                    # Parse the response
                    parsed_result = parse_api_response(api_result)
                    
                    if parsed_result:
                        # Store the route analysis
                        route_data = {
                            "source": source,
                            "destination": destination,
                            "transport_mode": transport_mode,
                            "route_priority": route_priority,
                            "ai_analysis": parsed_result["raw_response"],
                            "additional_params": additional_params,
                            "timestamp": parsed_result["timestamp"],
                            "query_used": query
                        }
                        
                        # Try to geocode for map display (fallback for visualization)
                        try:
                            source_coords = geocode_address(source)
                            dest_coords = geocode_address(destination)
                            if source_coords[0] and dest_coords[0]:
                                route_data.update({
                                    "source_coords": source_coords,
                                    "dest_coords": dest_coords
                                })
                        except:
                            pass
                        
                        st.session_state.current_route = route_data
                        st.session_state.route_history.append(route_data)
                        
                        st.success("🎉 **AI Route Analysis Complete!** Check the results below.")
                        st.rerun()
                else:
                    status.update(label="❌ **Analysis Failed**", state="error")
                    st.error(f"**Error:** {api_result['error']}")
                    
                    # Provide helpful troubleshooting
                    with st.expander("🔧 **Troubleshooting**"):
                        st.markdown("""
                        **Common solutions:**
                        1. **Backend not running**: Start the backend server with `python api.py`
                        2. **Port conflict**: Check if port 8000 is available
                        3. **Network issues**: Verify localhost connectivity
                        4. **Agent error**: Check backend logs for detailed error information
                        """)
        
        # Display current analysis results
        if st.session_state.current_route and "ai_analysis" in st.session_state.current_route:
            st.markdown("### 📊 **Current Route Analysis**")
            route = st.session_state.current_route
            
            st.info(f"**🗺️ Route:** {route['source']} → {route['destination']}")
            st.info(f"**🚗 Mode:** {route['transport_mode']} | **🎯 Priority:** {route['route_priority']}")
            
            # Quick action buttons
            col_save, col_share = st.columns(2)
            with col_save:
                if st.button("💾 Save Analysis", use_container_width=True):
                    st.success("Route analysis saved to history!")
            
            with col_share:
                if st.button("📋 Copy Analysis", use_container_width=True):
                    st.info("Analysis copied to clipboard!")
    
    with col2:
        st.subheader("📍 Interactive Map & Route Visualization")
        
        # Always show map - either for selection or visualization
        if st.session_state.current_route and "ai_analysis" in st.session_state.current_route:
            route = st.session_state.current_route
            
            # Tabbed interface for analyzed routes
            tab1, tab2, tab3 = st.tabs(["🗺️ **Map View**", "🤖 **AI Analysis**", "� **Details**"])
            
            with tab1:
                st.markdown("#### �🗺️ **Your Route Visualization**")
                
                # Map visualization
                if "source_coords" in route and "dest_coords" in route:
                    source_coords = route["source_coords"]
                    dest_coords = route["dest_coords"]
                    
                    if source_coords[0] and dest_coords[0]:
                        # Calculate center point and zoom
                        center_lat = (source_coords[0] + dest_coords[0]) / 2
                        center_lon = (source_coords[1] + dest_coords[1]) / 2
                        
                        # Create map
                        m = create_map(center=[center_lat, center_lon])
                        m = add_route_to_map(m, source_coords, dest_coords)
                        
                        # Display interactive map
                        map_data = st_folium(m, width=700, height=500, key="route_map")
                        
                        st.info("🗺️ Your planned route with AI-optimized path")
                    else:
                        st.warning("📍 Map coordinates not available - showing default map")
                        default_map = create_map()
                        st_folium(default_map, width=700, height=500, key="default_map")
                else:
                    st.info("�️ Map visualization will appear here after geocoding")
                    default_map = create_map()
                    st_folium(default_map, width=700, height=500, key="fallback_map")
            
            with tab2:
                st.markdown("#### 🧠 **Intelligent Route Analysis**")
                st.markdown(f"*Generated on {route['timestamp']}*")
                
                # Display the AI analysis in an attractive format
                with st.container():
                    analysis_text = route['ai_analysis']
                    
                    # Try to format the response nicely
                    if isinstance(analysis_text, str):
                        st.markdown(analysis_text)
                    else:
                        st.write(analysis_text)
                
                # Feedback section
                st.markdown("---")
                st.markdown("#### 💬 **Feedback on AI Analysis**")
                col_feedback = st.columns(3)
                with col_feedback[0]:
                    if st.button("👍 Helpful"):
                        st.success("Thank you for your feedback!")
                with col_feedback[1]:
                    if st.button("👎 Not Helpful"):
                        st.info("We'll improve our analysis!")
                with col_feedback[2]:
                    if st.button("🔄 Re-analyze"):
                        # Clear current route to trigger re-analysis
                        if st.session_state.current_route:
                            del st.session_state.current_route
                        st.rerun()
            
            with tab3:
                # Route details and metadata
                st.markdown("#### 📋 **Route Planning Details**")
                
                details_data = {
                    "Source": route.get('source', 'N/A'),
                    "Destination": route.get('destination', 'N/A'),
                    "Transportation": route.get('transport_mode', 'N/A'),
                    "Priority": route.get('route_priority', 'N/A'),
                    "Analysis Time": route.get('timestamp', 'N/A')
                }
                
                for key, value in details_data.items():
                    st.text(f"{key}: {value}")
                
                # Additional parameters
                if route.get('additional_params'):
                    st.markdown("**Additional Preferences:**")
                    for param, value in route['additional_params'].items():
                        if value and value != False:
                            st.text(f"• {param.replace('_', ' ').title()}: {value}")
        
        else:
            # Interactive map for route selection
            st.markdown("#### 🗺️ **Interactive Route Selection Map**")
            st.info("👆 **Click on the map to select locations** - then fill in the form on the left")
            
            # Create an interactive map for location selection
            selection_map = create_map()
            
            # Display the interactive map
            map_data = st_folium(
                selection_map, 
                width=700, 
                height=500,
                key="selection_map"
            )
            
            # Show click coordinates if available
            if map_data and map_data.get("last_object_clicked"):
                clicked_data = map_data["last_object_clicked"]
                if clicked_data:
                    lat = clicked_data.get("lat")
                    lng = clicked_data.get("lng")
                    if lat and lng:
                        st.success(f"📍 **Location Selected:** {lat:.4f}, {lng:.4f}")
                        st.info("� Copy these coordinates or nearby address to the form on the left")
                        
                        # Try to reverse geocode the coordinates
                        try:
                            import requests
                            response = requests.get(
                                f"https://nominatim.openstreetmap.org/reverse",
                                params={
                                    "lat": lat,
                                    "lon": lng,
                                    "format": "json"
                                },
                                timeout=5
                            )
                            if response.status_code == 200:
                                data = response.json()
                                address = data.get("display_name", "Address not found")
                                st.code(f"Address: {address}")
                        except:
                            st.code(f"Coordinates: {lat:.4f}, {lng:.4f}")
            
            st.markdown("""
            ### 🤖 **How our AI Route Planning works:**
            
            1. **🔍 Route Planner Agent** - Finds multiple route options using advanced mapping
            2. **🌐 Research Agent** - Analyzes real-time data including:
               - Traffic conditions
               - Weather impact
               - Environmental factors
               - Road conditions
            3. **💡 Suggestion Agent** - Provides personalized recommendations based on:
               - Your preferences
               - Environmental impact
               - Cost efficiency
               - Time optimization
            
            ### 🌱 **Environmental Benefits:**
            - CO₂ emission calculations
            - Fuel efficiency optimization
            - Alternative eco-friendly routes
            - Impact comparisons
            """)

def route_history_page():
    """Display route history with AI analysis"""
    st.title("📜 Route History")
    
    if not st.session_state.route_history:
        st.info("� **No routes planned yet**")
        st.markdown("""
        Start by planning your first intelligent route using our AI agents!
        
        Our system will analyze:
        - 🗺️ Optimal route options
        - 🌍 Environmental impact
        - 🚦 Real-time traffic conditions
        - ⚡ Personalized recommendations
        """)
        
        col_empty1, col_center, col_empty2 = st.columns([1, 2, 1])
        with col_center:
            if st.button("🗺️ Plan Your First Route", use_container_width=True, type="primary"):
                st.session_state.current_page = "route_planner"
                st.rerun()
        return
    
    # Filter and search controls
    st.markdown("### 🔍 **Search & Filter**")
    col1, col2, col3 = st.columns([3, 1, 1])
    
    with col1:
        search_term = st.text_input(
            "Search routes",
            placeholder="Search by location, transport mode, or priority...",
            help="Search through your route history"
        )
    
    with col2:
        transport_filter = st.selectbox(
            "Transport Mode",
            ["All"] + ["Car", "Bike", "Public Transport", "Walking", "Mixed"]
        )
    
    with col3:
        sort_by = st.selectbox(
            "Sort by",
            ["Most Recent", "Oldest", "Source A-Z", "Destination A-Z"]
        )
    
    # Filter routes
    filtered_routes = st.session_state.route_history.copy()
    
    # Apply search filter
    if search_term:
        search_lower = search_term.lower()
        filtered_routes = [
            route for route in filtered_routes
            if (search_lower in route.get('source', '').lower() or
                search_lower in route.get('destination', '').lower() or
                search_lower in route.get('transport_mode', '').lower() or
                search_lower in route.get('route_priority', '').lower())
        ]
    
    # Apply transport filter
    if transport_filter != "All":
        filtered_routes = [
            route for route in filtered_routes
            if route.get('transport_mode') == transport_filter
        ]
    
    # Apply sorting
    if sort_by == "Most Recent":
        filtered_routes = sorted(filtered_routes, key=lambda x: x.get('timestamp', ''), reverse=True)
    elif sort_by == "Oldest":
        filtered_routes = sorted(filtered_routes, key=lambda x: x.get('timestamp', ''))
    elif sort_by == "Source A-Z":
        filtered_routes = sorted(filtered_routes, key=lambda x: x.get('source', ''))
    elif sort_by == "Destination A-Z":
        filtered_routes = sorted(filtered_routes, key=lambda x: x.get('destination', ''))
    
    # Display results summary
    st.markdown(f"### 📊 **Found {len(filtered_routes)} routes** (of {len(st.session_state.route_history)} total)")
    
    # Display route cards
    for i, route in enumerate(filtered_routes):
        with st.container():
            # Create an expandable card for each route
            with st.expander(
                f"🗺️ **{route.get('source', 'Unknown')} → {route.get('destination', 'Unknown')}**",
                expanded=False
            ):
                col_info, col_actions = st.columns([3, 1])
                
                with col_info:
                    # Route metadata
                    st.markdown(f"""
                    **📅 Planned:** {route.get('timestamp', 'Unknown date')}  
                    **🚗 Transport:** {route.get('transport_mode', 'Unknown')}  
                    **🎯 Priority:** {route.get('route_priority', 'Unknown')}
                    """)
                    
                    # Show AI analysis if available
                    if 'ai_analysis' in route:
                        st.markdown("#### 🤖 **AI Analysis Summary**")
                        
                        # Show a preview of the analysis
                        analysis = route['ai_analysis']
                        if isinstance(analysis, str) and len(analysis) > 300:
                            preview = analysis[:300] + "..."
                            st.markdown(f"*{preview}*")
                            
                            if st.button(f"📖 Read Full Analysis", key=f"read_full_{i}"):
                                # Show full analysis in a modal-like expander
                                with st.expander("� **Complete AI Analysis**", expanded=True):
                                    st.markdown(analysis)
                        else:
                            st.markdown(f"*{analysis}*")
                    
                    # Show additional parameters if available
                    if route.get('additional_params'):
                        with st.expander("⚙️ **Route Preferences**"):
                            for param, value in route['additional_params'].items():
                                if value and value != False:
                                    st.text(f"• {param.replace('_', ' ').title()}: {value}")
                
                with col_actions:
                    st.markdown("#### **Actions**")
                    
                    # View route button
                    if st.button("👁️ View Route", key=f"view_{i}", help="View route on map"):
                        st.session_state.current_route = route
                        if 'source_coords' in route and 'dest_coords' in route:
                            st.session_state.map_center = [
                                (route['source_coords'][0] + route['dest_coords'][0]) / 2,
                                (route['source_coords'][1] + route['dest_coords'][1]) / 2
                            ]
                        st.session_state.current_page = "route_planner"
                        st.rerun()
                    
                    # Re-analyze button
                    if st.button("🔄 Re-analyze", key=f"reanalyze_{i}", help="Re-run AI analysis"):
                        # Create a new query and re-analyze
                        if all(k in route for k in ['source', 'destination', 'transport_mode', 'route_priority']):
                            query = create_route_query(
                                route['source'],
                                route['destination'],
                                route['transport_mode'],
                                route['route_priority'],
                                route.get('additional_params', {})
                            )
                            
                            with st.spinner("Re-analyzing with AI..."):
                                api_result = call_ecoroute_api(query)
                                
                                if api_result["success"]:
                                    parsed_result = parse_api_response(api_result)
                                    if parsed_result:
                                        # Update the route with new analysis
                                        route['ai_analysis'] = parsed_result["raw_response"]
                                        route['timestamp'] = parsed_result["timestamp"]
                                        st.success("✅ Route re-analyzed successfully!")
                                        st.rerun()
                                else:
                                    st.error(f"Re-analysis failed: {api_result['error']}")
                    
                    # Export button
                    if st.button("📋 Export", key=f"export_{i}", help="Export route analysis"):
                        # Create exportable data
                        export_data = {
                            "route": f"{route.get('source')} → {route.get('destination')}",
                            "transport_mode": route.get('transport_mode'),
                            "route_priority": route.get('route_priority'),
                            "timestamp": route.get('timestamp'),
                            "ai_analysis": route.get('ai_analysis', 'No analysis available')
                        }
                        
                        export_text = json.dumps(export_data, indent=2)
                        st.download_button(
                            "💾 Download JSON",
                            data=export_text,
                            file_name=f"ecoroute_analysis_{i+1}.json",
                            mime="application/json",
                            key=f"download_{i}"
                        )
                    
                    # Delete button
                    if st.button("🗑️ Delete", key=f"delete_{i}", help="Delete this route", type="secondary"):
                        if st.session_state.route_history:
                            st.session_state.route_history.remove(route)
                            st.success("Route deleted successfully!")
                            st.rerun()
        
        st.divider()
    
    # Bulk actions
    if filtered_routes:
        st.markdown("### 🔧 **Bulk Actions**")
        col_bulk1, col_bulk2, col_bulk3 = st.columns(3)
        
        with col_bulk1:
            if st.button("📊 Export All Routes", use_container_width=True):
                # Export all filtered routes
                export_data = []
                for route in filtered_routes:
                    export_data.append({
                        "route": f"{route.get('source')} → {route.get('destination')}",
                        "transport_mode": route.get('transport_mode'),
                        "route_priority": route.get('route_priority'),
                        "timestamp": route.get('timestamp'),
                        "ai_analysis": route.get('ai_analysis', 'No analysis available')
                    })
                
                export_text = json.dumps(export_data, indent=2)
                st.download_button(
                    "💾 Download All as JSON",
                    data=export_text,
                    file_name="ecoroute_history.json",
                    mime="application/json"
                )
        
        with col_bulk2:
            if st.button("🔄 Re-analyze All", use_container_width=True):
                st.info("Bulk re-analysis feature coming soon!")
        
        with col_bulk3:
            if st.button("🗑️ Clear History", use_container_width=True, type="secondary"):
                if st.button("⚠️ Confirm Delete All", type="secondary"):
                    st.session_state.route_history = []
                    st.success("All route history cleared!")
                    st.rerun()

# Main application
def main():
    """Main application logic"""
    init_session_state()
    
    # Check authentication
    if not st.session_state.authenticated:
        auth_page()
        return
    
    # Sidebar navigation
    with st.sidebar:
        st.title("🌱 EcoRoute")
        
        user_name = get_user_name()
        st.write(f"👋 Welcome, **{user_name}**")
        
        st.divider()
        
        # Navigation
        if st.button("📊 Dashboard", 
                    use_container_width=True, 
                    type="primary" if st.session_state.current_page == "dashboard" else "secondary"):
            st.session_state.current_page = "dashboard"
            st.rerun()
        
        if st.button("🗺️ Route Planner", 
                    use_container_width=True,
                    type="primary" if st.session_state.current_page == "route_planner" else "secondary"):
            st.session_state.current_page = "route_planner"
            st.rerun()
        
        if st.button("📜 Route History", 
                    use_container_width=True,
                    type="primary" if st.session_state.current_page == "route_history" else "secondary"):
            st.session_state.current_page = "route_history"
            st.rerun()
        
        st.divider()
        
        # Quick stats
        st.subheader("Quick Stats")
        st.metric("Total Routes", len(st.session_state.route_history))
        
        if st.session_state.route_history:
            total_distance = sum(route.get('distance', 0) for route in st.session_state.route_history)
            st.metric("Total Distance", f"{total_distance:.1f} km")
        
        st.divider()
        
        # Sign out
        if st.button("🚪 Sign Out", use_container_width=True, type="secondary"):
            sign_out_user()
    
    # Main content area
    # Show page based on session state
    with st.container():
        if st.session_state.current_page == "route_planner":
            route_planner_page()
        elif st.session_state.current_page == "route_history":
            route_history_page()
        else:
            dashboard_page()

if __name__ == "__main__":
    main()