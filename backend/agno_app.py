# playground.py - Agno Route Workflow Playground

from agno.agent import Agent
from agno.workflow.v2.workflow import Workflow
from agno.workflow.v2.step import Step 
from agno.run.v2.workflow import WorkflowRunResponse
from agno.models.google import Gemini 
from agno.storage.sqlite import SqliteStorage
from agno.playground import Playground, serve_playground_app

from dotenv import load_dotenv, find_dotenv
import os 
import sys 

# Set up env vars 
load_dotenv(find_dotenv(filename=".env"))
os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")

# Import agent creation functions
from agents.route_planner_agent import create_route_planner_agent
from agents.route_research_agent import create_route_research_agent
from agents.sugesstion_agent import create_suggestion_agent

# Extract all the agents from the functions
try:
    route_planner_agent = create_route_planner_agent()
    route_research_agent = create_route_research_agent()
    suggestion_agent = create_suggestion_agent()
    print("✅ All agents created successfully")
except Exception as e:
    print(f"❌ Error extracting agents: {e}")
    sys.exit(1)

# Define workflow steps
route_planning_step = Step(
    name="Route Planning Step",
    description="Finds multiple route options between source and destination",
    agent=route_planner_agent,
)

route_research_step = Step(
    name="Route Research Step", 
    description="Performs deep web research and scores routes based on user parameters",
    agent=route_research_agent,
)

route_suggestion_step = Step(
    name="Route Suggestion Step",
    description="Provides neat, concise recommendations based on route analysis",
    agent=suggestion_agent,
)

# Creating the workflow
route_workflow = Workflow(
    name="EcoRoute Workflow",
    description="A workflow to find, research, and suggest optimal eco-friendly routes",
    steps=[
        route_planning_step,
        route_research_step, 
        route_suggestion_step
    ],
    storage=SqliteStorage(
        db_file="agent_storage/route_workflow.db",
        table_name="route_workflow_storage"
    ),
)

# Create individual agents for playground (optional - for testing individual agents)
individual_agents = [
    route_planner_agent,
    route_research_agent, 
    suggestion_agent
]

# Create the playground app
app = Playground(
    name = "EcoRoute Playground",
    description="A playground to interact with the EcoRoute workflow and its agents",
    agents=individual_agents,
    workflows=[route_workflow],
).get_app()

if __name__ == "__main__":
    # Serve the playground app
    serve_playground_app(
        "agno_app:app",  # Reference to the app variable above
        reload=True,
        host="localhost",
        port=7777
    )
    
    print("🚀 Playground started!")
    print("📱 Open http://app.agno.com/playground in your browser")
    print("🔗 Add endpoint: localhost:7777/v1")
    print("💬 Start chatting with your EcoRoute workflow!")