# Route Research Agent - Deep Web Research and Scoring

import os 
import sys 

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agno.agent import Agent,RunResponse
from agno.models.google import Gemini
from agno.storage.sqlite import SqliteStorage
from agno.tools.linkup import LinkupTools
from dotenv import load_dotenv, find_dotenv

# Env variables
load_dotenv(find_dotenv(filename=".env"))
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
os.environ["LINKUP_API_KEY"] = os.getenv("LINKUP_API_KEY") 
os.environ["BRIGHT_DATA_API_KEY"] = os.getenv("BRIGHT_DATA_API_KEY")

def create_route_research_agent():
    return Agent(
        name="Route Research Agent",
        role="You are a route research specialist that performs deep web analysis to score routes based on user preferences.",
        description="I research and analyze routes using web data to provide detailed scoring on traffic patterns, eco-friendliness, and other user-specified parameters.",
        model=Gemini(
            id="gemini-2.0-flash-lite",
            temperature=0.4
        ),
        storage=SqliteStorage(
            db_file="agent_storage/route_research_agent.db",
            table_name="route_research_sessions"
        ),
        tools=[LinkupTools()],
        instructions=[
            "You are a route research agent. Your job is to analyze routes and score them based on user parameters.",
            "You will receive route data from the previous step and user parameters from the original message.",
            "NEVER ask for route options - they are provided in the previous step content.",
            "Extract user parameters from the message (low traffic, eco-friendliness, charging stations, etc.).",
            "",
            "For each route provided, you must:",
            "1. Use LinkupTools to research:",
            "   - Traffic patterns for major roads mentioned in the route",
            "   - EV charging infrastructure along the route",
            "   - Environmental factors and fuel efficiency",
            "",
            "2. Score each route (0-100) for each parameter found in the original message.",
            "",
            "3. Format your response as:",
            "   ROUTE [NUMBER] ANALYSIS:",
            "   - Route Summary: [brief description from previous step]",
            "   - Parameter Scores:",
            "     * [Parameter]: [Score]/100 - [Web research justification]",
            "   - Key Findings: [important discoveries]",
            "   - Route path : The basic arrow path of the route with main roads in it",
            "",
            "Always analyze the routes provided in the previous step. Do not ask for route information.",
        ],
        read_chat_history=True,
        num_history_responses=3,
        markdown=True,
        show_tool_calls=True,
        add_context=True,
        monitoring=True
    )

# Create and test the agent

#if __name__ == "__main__":
#
#    route_research_agent = create_route_research_agent()
#
#    route_research_agent.print_response(
#
#        message = """
#
#        Analyze the following routes based on user parameters:
#
#        Source : New York, NY
#        Destination: Philadelphia, PA
#
#        ROUTE 1:
#        - Distance: 15 miles
#        - Time: 25 minutes
#        - Instructions: Take Main St to 1st Ave, then merge onto Highway 50
#        - Toll: Yes
#
#
#        ROUTE 2:
#        - Distance: 10 miles
#        - Time: 15 minutes
#        - Instructions: Take Elm St to 2nd Ave, then merge onto Highway 50
#        - Toll: No
#
#        USER PARAMETERS:
#
#        1. Low Traffic Rate
#        2. Eco-Friendliness
#        3. Fuel Efficiency
#
#        Provide a detailed analysis and scoring for each route based on deep web research.
#        """
#    )