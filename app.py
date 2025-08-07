import streamlit as st
import requests
import json
from typing import Dict, Any

# Configure Streamlit page
st.set_page_config(
    page_title="EcoRoute - Eco-Friendly Routes",
    page_icon="🌱",
    layout="wide"
)

# API Configuration
API_BASE_URL = "http://localhost:8000"

def check_api_health() -> bool:
    """Check if the API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def get_route_suggestions(source: str, destination: str, vehicle_type: str, features: str) -> Dict[str, Any]:
    """Call the API to get route suggestions"""
    try:
        payload = {
            "source": source,
            "destination": destination,
            "vehicle_type": vehicle_type,
            "features": features
        }
        
        response = requests.post(
            f"{API_BASE_URL}/response",
            json=payload,
            timeout=60
        )
        
        return response.json()
    except requests.exceptions.Timeout:
        return {"success": False, "message": "Request timed out. Please try again."}
    except requests.exceptions.ConnectionError:
        return {"success": False, "message": "Cannot connect to API. Make sure the server is running."}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

def main():
    # Header
    st.title("🌱 EcoRoute - Eco-Friendly Route Suggestions")
    st.markdown("Find the most environmentally friendly routes for your journey!")
    
    # Check API status
    st.sidebar.header("🔧 System Status")
    if check_api_health():
        st.sidebar.success("✅ API Server: Online")
    else:
        st.sidebar.error("❌ API Server: Offline")
        st.error("⚠️ Cannot connect to the API server. Make sure it's running on http://localhost:8000")
        st.info("Run: `python ecoroute_api.py` to start the server")
        return
    
    # Main form
    st.header("📍 Plan Your Eco-Friendly Route")
    
    # Initialize session state for results
    if 'route_result' not in st.session_state:
        st.session_state.route_result = None
    if 'form_data' not in st.session_state:
        st.session_state.form_data = {}
    
    with st.form("route_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            source = st.text_input(
                "Starting Location *",
                placeholder="e.g., New York, NY",
                help="Enter your starting point"
            )
            
            vehicle_type = st.selectbox(
                "Vehicle Type",
                options=[
                    "Electric Vehicle",
                    "Hybrid Vehicle", 
                    "Gasoline Vehicle",
                    "Bicycle",
                    "Public Transport",
                    "Walking"
                ],
                index=0
            )
        
        with col2:
            destination = st.text_input(
                "Destination *",
                placeholder="e.g., Boston, MA",
                help="Enter your destination"
            )
            
            features = st.text_area(
                "Eco-Friendly Features",
                placeholder="e.g., charging stations, bike lanes, low traffic routes",
                help="Specify any eco-friendly features you'd like to prioritize",
                height=100
            )
        
        # Submit button
        submitted = st.form_submit_button("🚀 Find Eco-Friendly Routes", type="primary")
        
        if submitted:
            # Validation
            if not source.strip():
                st.error("❌ Please enter a starting location")
            elif not destination.strip():
                st.error("❌ Please enter a destination")
            else:
                # Store form data
                st.session_state.form_data = {
                    'source': source.strip(),
                    'destination': destination.strip(),
                    'vehicle_type': vehicle_type,
                    'features': features.strip()
                }
                
                # Show loading
                with st.spinner("🔍 Searching for eco-friendly routes... This may take a moment..."):
                    # Call API
                    result = get_route_suggestions(
                        source=source.strip(),
                        destination=destination.strip(),
                        vehicle_type=vehicle_type,
                        features=features.strip()
                    )
                
                # Store result in session state
                st.session_state.route_result = result
    
    # Display results outside the form
    if st.session_state.route_result:
        result = st.session_state.route_result
        form_data = st.session_state.form_data
        
        if result.get("success", False):
            st.success("✅ Route suggestions generated successfully!")
            
            # Display route suggestions
            st.header("🌿 Your Eco-Friendly Route Suggestions")
            st.markdown(result.get("route_suggestions", "No suggestions available"))
            
            # Add download option (outside the form)
            if result.get("route_suggestions"):
                st.download_button(
                    label="📥 Download Route Suggestions",
                    data=result["route_suggestions"],
                    file_name=f"ecoroute_{form_data['source'].replace(' ', '_')}_to_{form_data['destination'].replace(' ', '_')}.txt",
                    mime="text/plain"
                )
                
        else:
            st.error(f"❌ {result.get('message', 'Unknown error occurred')}")
            
        # Clear results button
        if st.button("🔄 Search Again"):
            st.session_state.route_result = None
            st.session_state.form_data = {}
            st.rerun()
    
    # Information sidebar
    st.sidebar.header("ℹ️ About EcoRoute")
    st.sidebar.info(
        """
        EcoRoute helps you find environmentally friendly travel routes using AI agents.
        
        **Features:**
        - Multi-modal transportation options
        - Real-time route optimization
        - Eco-friendly recommendations
        - Charging station locations
        - Traffic-aware routing
        """
    )
    
    st.sidebar.header("🚗 Vehicle Types")
    st.sidebar.markdown("""
    - **Electric Vehicle**: Zero emissions
    - **Hybrid Vehicle**: Reduced emissions
    - **Gasoline Vehicle**: Standard vehicle
    - **Bicycle**: Zero emissions, healthy
    - **Public Transport**: Shared emissions
    - **Walking**: Zero emissions, exercise
    """)
    
    st.sidebar.header("🌱 Eco Features")
    st.sidebar.markdown("""
    You can specify features like:
    - Charging stations
    - Bike lanes
    - Low traffic routes
    - Public transport connections
    - Scenic routes
    - Fuel-efficient paths
    """)

    # Footer
    st.markdown("---")
    st.markdown(
        """
        <div style='text-align: center'>
        <p>🌍 Making transportation more sustainable, one route at a time</p>
        </div>
        """,
        unsafe_allow_html=True
    )

if __name__ == "__main__":
    main()