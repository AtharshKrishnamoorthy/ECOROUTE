# Route Workflow - Connects Route Planning, Research, and Suggestion Agents

from agno.agent import Agent
from agno.workflow.v2.workflow import Workflow
from agno.workflow.v2.step import Step 
from agno.run.v2.workflow import WorkflowRunResponse
from agno.models.google import Gemini 
from agno.storage.sqlite import SqliteStorage

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

# WORKFLOW
# Route Planner (Gets routes from source to destination) -> Route Research (Deep web research and scoring based on user parameters) -> Suggestion Agent (Provides neat recommendations)

# Extract all the agents from the functions
try:
    route_planner_agent = create_route_planner_agent()
    route_research_agent = create_route_research_agent()
    suggestion_agent = create_suggestion_agent()
except Exception as e:
    print(f"Error extracting agents: {e}")

# Define workflow steps

# Step 1: Route Planning step
route_planning_step = Step(
    name="Route Planning Step",
    description="Finds multiple route options between source and destination",
    agent=route_planner_agent,
)

# Step 2: Route Research step
route_research_step = Step(
    name="Route Research Step",
    description="Performs deep web research and scores routes based on user parameters",
    agent=route_research_agent,
)

# Step 3: Route Suggestion step
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

if __name__ == "__main__":
    route_workflow.print_response(
        message="Find 3 eco-friendly routes from New York to Boston with focus on low traffic and electric vehicle charging stations",
        stream=True,
        stream_intermediate_steps=True
    )
