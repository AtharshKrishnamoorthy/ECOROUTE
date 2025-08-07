from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import os
import sys
from dotenv import load_dotenv, find_dotenv

# Import your EcoAgent class
from main import EcoAgent, create_directories

# Load environment variables
load_dotenv(find_dotenv(filename=".env"))

# FastAPI app instance
app = FastAPI(
    title="EcoRoute API",
    description="Eco-friendly route suggestions API using AI agents",
    version="1.0.0"
)

# Pydantic models for request/response
class RouteRequest(BaseModel):
    source: str = Field(..., description="Starting location", example="New York, NY")
    destination: str = Field(..., description="Destination location", example="Boston, MA")
    vehicle_type: str = Field(
        default="Gasoline Vehicle", 
        description="Type of vehicle",
        example="Electric Vehicle"
    )
    features: str = Field(
        default="", 
        description="Eco-friendly features desired",
        example="charging stations, bike lanes, low traffic routes"
    )

class RouteResponse(BaseModel):
    success: bool
    message: str
    route_suggestions: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    message: str

# Create directories on startup
@app.on_event("startup")
async def startup_event():
    """Initialize required directories and check environment"""
    try:
        create_directories()
        
        # Check required environment variables
        required_env_vars = ["GOOGLE_API_KEY", "AGNO_API_KEY", "LINKUP_API_KEY", "BRIGHT_DATA_API_KEY"]
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            print(f"⚠️ Warning: Missing environment variables: {', '.join(missing_vars)}")
        else:
            print("✅ All environment variables loaded successfully")
            
        print("🌱 EcoRoute API started successfully!")
        
    except Exception as e:
        print(f"❌ Startup error: {str(e)}")

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Simple health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="EcoRoute API is running successfully"
    )

# Main route suggestion endpoint
@app.post("/response", response_model=RouteResponse)
async def get_route_suggestions(request: RouteRequest):
    """
    Get eco-friendly route suggestions
    
    - **source**: Starting location (required)
    - **destination**: Destination location (required) 
    - **vehicle_type**: Type of vehicle (optional, defaults to "Gasoline Vehicle")
    - **features**: Desired eco-friendly features (optional)
    """
    try:
        # Validate input
        if not request.source.strip():
            raise HTTPException(status_code=400, detail="Source location is required")
        
        if not request.destination.strip():
            raise HTTPException(status_code=400, detail="Destination location is required")
        
        # Create EcoAgent instance
        eco_agent = EcoAgent(
            source=request.source.strip(),
            dest=request.destination.strip(),
            vehicle_type=request.vehicle_type,
            features=request.features
        )
        
        # Generate query
        query = f"Find the most eco-friendly route from {request.source} to {request.destination} using {request.vehicle_type}"
        if request.features:
            query += f" with focus on {request.features}"
        
        # Get route suggestions
        result = eco_agent.run_response(query)
        
        return RouteResponse(
            success=True,
            message="Route suggestions generated successfully",
            route_suggestions=result
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        error_message = f"Error generating route suggestions: {str(e)}"
        print(f"❌ {error_message}")
        
        return RouteResponse(
            success=False,
            message=error_message,
            route_suggestions=None
        )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🌱 Welcome to EcoRoute API",
        "description": "Eco-friendly route suggestions powered by AI agents",
        "endpoints": {
            "/health": "Health check",
            "/response": "Get route suggestions (POST)",
            "/docs": "API documentation"
        },
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    
    # Run the FastAPI server
    uvicorn.run(
        "ecoroute_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )