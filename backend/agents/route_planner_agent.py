# Route Planner Agent with Waypoints for Next Agent Context

import os 
import sys 

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agno.agent import Agent 
from agno.models.google import Gemini
from agno.storage.sqlite import SqliteStorage
from dotenv import load_dotenv, find_dotenv

# Import the tool with waypoints
from tools.geoapify import get_map_route_tool

# Env variables
load_dotenv(find_dotenv(filename=".env"))
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

def create_route_planner_agent():
    return Agent(
        name="Route Planner Agent",
        role="You are an intelligent route planner that analyzes and presents optimal travel routes with comprehensive route information.",
        description="I analyze multiple route options and provide clear, actionable travel recommendations with distance, time, and turn-by-turn guidance.",
        model=Gemini(
            id="gemini-2.0-flash-exp",
            temperature=0.3
        ),
        storage=SqliteStorage(
            db_file="agent_storage/route_planner_agent.db",
            table_name="route_planner_sessions"
        ),
        tools=[get_map_route_tool],
        instructions=[
            "You are a route planning agent. Your ONLY job is to call the get_map_route_tool and provide route information.",
            "ALWAYS extract source, destination, and number of routes from the user message and call get_map_route_tool immediately.",
            "If the message contains 'from X to Y' or similar, use X as source and Y as destination.",
            "If no specific number is mentioned, default to 3 routes.",
            "NEVER ask questions - ALWAYS call the tool with your best interpretation of the request.",
            "After calling the tool, format the results clearly showing:",
            "- Route number and distance/time",
            "- Major roads and highways from instructions",
            "- Toll information if applicable",
            "Do NOT discuss eco-friendliness, traffic, or charging stations - that's for the next agent.",
            "Just provide the basic route data from the tool.",
        ],
        read_chat_history=True,
        num_history_responses=2,
        markdown=False,
        show_tool_calls=False
    )

# Create and test the agent
if __name__ == "__main__":
    route_planner_agent = create_route_planner_agent()
    
    print("🤖 Route Planner Agent with Waypoints Ready!")
    
    # Test with a route request
    response = route_planner_agent.print_response(
        message="Get me 2 routes from Gandhipuram CBE to Coimbatore International Airport",
        stream=True,
        markdown=False
    )