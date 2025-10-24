# Route Suggestion Agent - Provides Neat Recommendations

import os 
import sys 

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agno.agent import Agent 
from agno.models.google import Gemini
from agno.storage.sqlite import SqliteStorage
from dotenv import load_dotenv, find_dotenv

# Env variables
load_dotenv(find_dotenv(filename=".env"))
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

def create_suggestion_agent():
    return Agent(
        name="Route Suggestion Agent",
        role="You are a route recommendation specialist that provides clear, concise travel suggestions based on route analysis.",
        description="I analyze route research data and provide neat, actionable recommendations to help users make the best travel decisions.",
        model=Gemini(
            id="gemini-2.0-flash-lite",
            temperature=0.3
        ),
        storage=SqliteStorage(
            db_file="agent_storage/suggestion_agent.db",
            table_name="suggestion_sessions"
        ),
        instructions=[
            "You are a route suggestion agent. Your job is to provide a final recommendation based on the route analysis from the previous step.",
            "You will receive route analysis with scores from the research agent.",
            "NEVER ask for route information - analyze what was provided in the previous step.",
            "",
            "Your task:",
            "1. Review the route scores and research findings from the previous step",
            "2. Identify the best route based on the highest scores for user parameters",
            "3. Provide ONE clear recommendation",
            "",
            "Format your response as:",
            "## 🎯 ROUTE RECOMMENDATION",
            "",
            "**RECOMMENDED ROUTE: Route [Number]**",
            "",
            "### 🗺️ Route Path:",
            "- [Basic arrow path of the route with main roads]",
            "",
            "### ✅ Why This Route:",
            "- [Key advantage from scores]",
            "- [Supporting research finding]",
            "",
            "### 📊 Score Summary:",
            "- [Parameter]: [Score]/100",
            "",
            "### 🚗 Travel Tips:",
            "- [Practical advice]",
            "",
            "Be concise and decisive. Pick the best route and explain why.",
        ],
        read_chat_history=True,
        num_history_responses=2,
        markdown=True,
        show_tool_calls=False
    )

def get_route_suggestion(research_analysis: str, user_preferences: str = ""):
    """
    Generate route suggestion based on research analysis
    
    Args:
        research_analysis (str): Detailed analysis from route research agent
        user_preferences (str): Additional user preferences or context
    
    Returns:
        str: Neat, concise route recommendation
    """
    
    suggestion_agent = create_suggestion_agent()
    
    suggestion_query = f"""
    Based on the following route research analysis, provide a clear and concise recommendation:
    
    ROUTE ANALYSIS:
    {research_analysis}
    
    USER CONTEXT:
    {user_preferences if user_preferences else "General travel recommendation needed"}
    
    Please provide a neat, actionable recommendation that helps the user choose the best route.
    """
    
    try:
        response = suggestion_agent.print_response(
            message=suggestion_query,
            stream=False,
            markdown=True
        )
        return response
    except Exception as e:
        return f"Error generating suggestion: {str(e)}"

# Test function
if __name__ == "__main__":
    suggestion_agent = create_suggestion_agent()
    
    print("💡 Route Suggestion Agent Ready!")
    
    # Test with sample route analysis
    sample_analysis = """
    ROUTE 1 ANALYSIS:
    - Route Summary: Highway route via I-95, 450 km, 4.5 hours
    - Parameter Scores:
      * Low Traffic Rate: 75/100 - Moderate congestion during peak hours
      * Eco-Friendliness: 60/100 - Limited EV charging stations
      * Fuel Efficiency: 80/100 - Mostly highway driving
    
    ROUTE 2 ANALYSIS:
    - Route Summary: Local roads route, 480 km, 5.2 hours
    - Parameter Scores:
      * Low Traffic Rate: 85/100 - Less congested local roads
      * Eco-Friendliness: 90/100 - Multiple EV charging stations
      * Fuel Efficiency: 65/100 - More city driving and stops
    """
    
    sample_preferences = "User prefers eco-friendly travel with electric vehicle"
    
    print("\n🧪 Testing route suggestion...")
    
    suggestion_agent.print_response(
        message=f"""
        Based on the following route research analysis, provide a clear and concise recommendation:
        
        ROUTE ANALYSIS:
        {sample_analysis}
        
        USER CONTEXT:
        {sample_preferences}
        
        Please provide a neat, actionable recommendation that helps the user choose the best route.
        """
    )
