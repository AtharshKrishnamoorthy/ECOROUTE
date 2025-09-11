"""
Minimal GeoApify Tool for Agno Agent - Token Efficient
Returns only essential route properties without coordinates to avoid token limits
"""

import requests
import json 
from dotenv import load_dotenv, find_dotenv
import os 
import sys
from typing import List, Dict, Any, Tuple

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(find_dotenv(".env"))

def get_map_route_tool(source: str, destination: str, n: int) -> List[Dict[str, Any]]:
    """
    Get N different route options with minimal data to avoid token limits.
    
    Args:
        source (str): Source location name 
        destination (str): Destination location name
        n (int): Number of different routes to retrieve
    
    Returns:
        List[Dict]: List of minimal route properties only
    """
    
    API_KEY = os.getenv("GEOAPIFY_API_KEY")
    
    if not API_KEY:
        return [{"error": "GeoApify API key not found"}]

    def geocode_location(location_name: str) -> Tuple[float, float]:
        """Convert location name to coordinates"""
        geocode_url = "https://api.geoapify.com/v1/geocode/search"
        params = {'text': location_name, 'apiKey': API_KEY, 'limit': 1}
        
        try:
            response = requests.get(geocode_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('features') and len(data['features']) > 0:
                coords = data['features'][0]['geometry']['coordinates']
                return coords[1], coords[0]  # (lat, lon)
            else:
                raise Exception(f"Location not found: {location_name}")
        except Exception as e:
            raise Exception(f"Geocoding failed: {str(e)}")

    def get_route_properties(source_coords: Tuple[float, float], 
                           dest_coords: Tuple[float, float], 
                           route_type: str = "balanced",
                           avoid_options: str = "") -> Dict[str, Any]:
        """Get only essential route properties with filtered instructions"""
        
        waypoints = f"{source_coords[0]},{source_coords[1]}|{dest_coords[0]},{dest_coords[1]}"
        
        params = {
            'waypoints': waypoints,
            'mode': 'drive',
            'type': route_type,
            'format': 'geojson',
            'apiKey': API_KEY
        }
        
        if avoid_options:
            params['avoid'] = avoid_options
            
        try:
            response = requests.get("https://api.geoapify.com/v1/routing", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data and data.get('features') and len(data['features']) > 0:
                properties = data['features'][0]['properties']
                
                # Extract only essential route information
                filtered_route = {
                    'mode': properties.get('mode'),
                    'units': properties.get('units'),
                    'distance': properties.get('distance'),
                    'distance_units': properties.get('distance_units'),
                    'time': properties.get('time')
                }
                
                # Extract only text instructions from steps
                instructions = []
                if 'legs' in properties and len(properties['legs']) > 0:
                    for leg in properties['legs']:
                        if 'steps' in leg:
                            for step in leg['steps']:
                                if 'instruction' in step and 'text' in step['instruction']:
                                    instructions.append(step['instruction']['text'])
                
                filtered_route['instructions'] = instructions
                
                # Include toll information if available
                if 'toll' in properties:
                    filtered_route['toll'] = properties['toll']
                
                return filtered_route
            else:
                return {'error': 'No route found', 'success': False}
                
        except Exception as e:
            return {'error': str(e), 'success': False}

    # Main execution
    try:
        print(f"🗺️ Finding {n} routes from {source} to {destination}...")
        
        # Geocode locations
        source_coords = geocode_location(source)
        dest_coords = geocode_location(destination)

        print(f"Geocoding successful. Source: {source_coords}, Destination: {dest_coords}")

        # Get N different routes using various strategies
        routes = []
        route_strategies = [
            {'type': 'balanced', 'avoid': ''},
            {'type': 'short', 'avoid': ''},
            {'type': 'less_maneuvers', 'avoid': ''},
            {'type': 'balanced', 'avoid': 'highways'},
            {'type': 'balanced', 'avoid': 'tolls'},
            {'type': 'short', 'avoid': 'highways'},
        ]

        print("Starting route calculations...")
        
        for i in range(n):
            print(f"Calculating route {i + 1}...")

            strategy = route_strategies[i % len(route_strategies)]
            
            route_info = get_route_properties(
                source_coords, 
                dest_coords, 
                strategy['type'], 
                strategy['avoid']
            )

            if route_info and 'error' not in route_info:
                route_info['route_number'] = i + 1
                routes.append(route_info)
                print(f"Route {i + 1} completed successfully.")
            else:
                print(f"Route {i + 1} failed: {route_info.get('error', 'Unknown error')}")
        
        return routes
            
    except Exception as e:
        return [{"error": str(e)}]

# Test function
if __name__ == "__main__":
    test_routes = get_map_route_tool("New York", "San Francisco", 3)
    
    print(test_routes)
