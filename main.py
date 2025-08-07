# Imports 
from agno.agent import Agent, RunResponse
from agno.models.google import Gemini 
from agno.storage.sqlite import SqliteStorage
from agno.tools.linkup import LinkupTools
from agno.tools.brightdata import BrightDataTools
from agno.team import Team 
from dotenv import load_dotenv, find_dotenv
import os 
import sys

load_dotenv(find_dotenv(filename=".env"))

# Env setup 
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
os.environ["AGNO_API_KEY"] = os.getenv("AGNO_API_KEY")
os.environ["LINKUP_API_KEY"] = os.getenv("LINKUP_API_KEY")
os.environ["BRIGHT_DATA_API_KEY"] = os.getenv("BRIGHT_DATA_API_KEY")

class EcoAgent:
    def __init__(self, source: str, dest: str, vehicle_type: str, features: str):
        self.source = source 
        self.dest = dest
        self.vehicle_type = vehicle_type
        self.features = features  # Changed from self.feature to self.features
        
    def create_agent_team(self):
        """Create and configure the agent team for eco-friendly route suggestions"""
        
        self.research_agent = Agent(
            name="Route Research Agent",
            role="Your task is to search for eco friendly routes",
            model=Gemini(
                id="gemini-2.0-flash-exp",
                temperature=0.4
            ),
            tools=[LinkupTools(depth="deep"), BrightDataTools()],
            storage=SqliteStorage(table_name="route_research_agent_session", db_file="tmp/data.db"),
            context={
                "source": self.source, 
                "destination": self.dest, 
                "vehicle_type": self.vehicle_type, 
                "features": self.features  # Now using self.features consistently
            },
            instructions=[
                "You will be given the context of the details like source, dest, features etc..",
                "Use Linkup tools and Bright Data tools to deep search and search through the websites for more optimized routes suggestions with asked features in the context",
                "Focus on eco-friendly aspects like fuel efficiency, electric vehicle charging stations, bike lanes, public transport options",
                "Look for routes with less traffic congestion to reduce emissions",
                "Consider alternative transportation methods if applicable"
            ],
            markdown=True,
            add_context=True,
            show_tool_calls=True,
            add_history_to_messages=True,
            num_history_responses=3,
            monitoring=True,
        )
        
        self.suggestion_agent = Agent(
            name="Route Suggestion Agent",
            role="Your task is to provide neat and clear suggestions to the user",
            model=Gemini(
                id="gemini-2.0-flash-exp",
                temperature=0.4
            ),
            storage=SqliteStorage(table_name="route_suggestion_agent_session", db_file="tmp/data.db"),
            instructions=[
                "You are given some optimized route suggestions",
                "Based on that, generate a neat suggestion for the user with more details.",
                "Include estimated travel time, distance, and eco-friendly benefits",
                "Provide multiple route options with pros and cons",
                "Include specific recommendations for charging stations, fuel-efficient driving tips, or public transport connections",
                "Format the response in a clear, user-friendly manner with proper sections"
            ],
            markdown=True,
            add_history_to_messages=True,
            num_history_responses=3,
            monitoring=True,
        )
        
        self.route_team = Team(
            name="Route Team",
            model=Gemini(id="gemini-2.0-flash-exp"),
            members=[self.research_agent, self.suggestion_agent],
            instructions=[
                "First research eco-friendly routes, then provide clear suggestions to the user",
                "Ensure comprehensive coverage of eco-friendly transportation options",
                "Coordinate between research and suggestion phases effectively"
            ],
            mode="coordinate",
            show_tool_calls=True,
            markdown=True,
        )
        
        return self.route_team
    
    def run_response(self, input_query: str):
        """Execute the agent team and return the response"""
        try:
            agent_team = self.create_agent_team()
            
            # Create a comprehensive query including context
            enhanced_query = f"""
            Route Request: {input_query}
            
            Context:
            - Source: {self.source}
            - Destination: {self.dest}
            - Vehicle Type: {self.vehicle_type}
            - Required Features: {self.features}
            
            Please provide eco-friendly route suggestions with detailed analysis.
            """
            
            response: RunResponse = agent_team.run(enhanced_query, markdown=True)
            
            # Handle different response formats
            if isinstance(response, dict) and "content" in response:
                return response["content"]
            elif hasattr(response, 'content'):
                return response.content
            else:
                return str(response)
                
        except Exception as e:
            print(f"Error in run_response: {str(e)}")
            return f"Sorry, there was an error processing your request: {str(e)}"

def create_directories():
    """Create necessary directories for storage"""
    if not os.path.exists("tmp"):
        os.makedirs("tmp")
        print("Created tmp directory for database storage")

def get_user_input():
    """Get user input for route parameters"""
    print("🌱 Welcome to EcoRoute - Eco-Friendly Route Suggestions! 🌱")
    print("=" * 60)
    
    source = input("Enter your starting location: ").strip()
    dest = input("Enter your destination: ").strip()
    
    print("\nVehicle Types:")
    print("1. Electric Vehicle")
    print("2. Hybrid Vehicle") 
    print("3. Gasoline Vehicle")
    print("4. Bicycle")
    print("5. Public Transport")
    print("6. Walking")
    
    vehicle_choice = input("Select vehicle type (1-6): ").strip()
    vehicle_map = {
        "1": "Electric Vehicle",
        "2": "Hybrid Vehicle", 
        "3": "Gasoline Vehicle",
        "4": "Bicycle",
        "5": "Public Transport",
        "6": "Walking"
    }
    vehicle_type = vehicle_map.get(vehicle_choice, "Gasoline Vehicle")
    
    print("\nEco-Friendly Features (you can mention multiple):")
    print("- Charging stations")
    print("- Bike lanes") 
    print("- Public transport connections")
    print("- Low traffic routes")
    print("- Scenic routes")
    print("- Fuel-efficient paths")
    
    features = input("Enter desired eco-friendly features: ").strip()
    
    return source, dest, vehicle_type, features

if __name__ == "__main__":
    try:
        # Create necessary directories
        create_directories()
        
        # Get user input
        source, dest, vehicle_type, features = get_user_input()
        
        # Validate inputs
        if not source or not dest:
            print("❌ Error: Source and destination are required!")
            sys.exit(1)
            
        # Create EcoAgent instance
        eco_agent = EcoAgent(source, dest, vehicle_type, features)
        
        print("\n🔍 Searching for eco-friendly routes...")
        print("This may take a moment as we analyze the best options for you...")
        print("-" * 60)
        
        # Generate route suggestions
        query = f"Find the most eco-friendly route from {source} to {dest} using {vehicle_type}"
        if features:
            query += f" with focus on {features}"
            
        result = eco_agent.run_response(query)
        
        print("\n🌿 ECO-FRIENDLY ROUTE SUGGESTIONS:")
        print("=" * 60)
        print(result)
        print("=" * 60)
        print("Thank you for choosing eco-friendly travel! 🌍")
        
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"❌ An unexpected error occurred: {str(e)}")
        sys.exit(1)