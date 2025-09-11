from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from agno.run.v2.workflow import WorkflowRunResponse
import uvicorn 
from route_workflow import route_workflow
from pydantic import BaseModel
from typing import Dict, Any, Optional
import asyncio
import uuid
import threading
import time

# Create a FastAPI instance
app = FastAPI(
    title="EcoRoute API",
    description="API for EcoRoute - Smart Route Planning",
    version="1.0.0"
)

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory storage for async job tracking
jobs: Dict[str, Dict[str, Any]] = {}

def run_workflow_in_background(job_id: str, query: str):
    """Run workflow in background thread"""
    try:
        print(f"Starting workflow for job {job_id}")
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["start_time"] = time.time()
        
        print(f"Running workflow with query: {query}")
        
        # Run the workflow
        response: WorkflowRunResponse = route_workflow.run(query)
        
        print(f"Workflow completed for job {job_id}")
        
        # Extract the actual response content
        if hasattr(response, 'content') and response.content:
            response_content = response.content
        elif hasattr(response, 'messages') and response.messages:
            response_content = response.messages[-1].content if response.messages else str(response)
        else:
            response_content = str(response)
        
        print(f"Response extracted for job {job_id}: {len(response_content)} characters")
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = response_content
        jobs[job_id]["end_time"] = time.time()
        
        print(f"Job {job_id} completed successfully")
        
    except Exception as e:
        print(f"Error in workflow for job {job_id}: {str(e)}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["end_time"] = time.time()


# Creating request and response models
class RouteRequest(BaseModel):
    query: str 

class RouteResponse(BaseModel):
    response: str 

class AsyncRouteRequest(BaseModel):
    query: str

class AsyncRouteResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    result: Optional[str] = None
    error: Optional[str] = None
    progress: Optional[float] = None
    elapsed_time: Optional[float] = None 


# Creating endpoints

# HEALTH CHECK
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "jobs_active": len([j for j in jobs.values() if j["status"] in ["pending", "processing"]])}

# ASYNC ROUTE ANALYSIS (Recommended)
@app.post("/route/analyze", response_model=AsyncRouteResponse)
async def analyze_route_async(request: AsyncRouteRequest):
    """Start async route analysis and return job ID for tracking"""
    try:
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        print(f"Creating new job with ID: {job_id}")
        print(f"Query: {request.query}")
        
        # Initialize job
        jobs[job_id] = {
            "status": "pending",
            "query": request.query,
            "created_time": time.time(),
            "start_time": None,
            "end_time": None,
            "result": None,
            "error": None
        }
        
        print(f"Job created: {jobs[job_id]}")
        
        # Start background processing
        thread = threading.Thread(target=run_workflow_in_background, args=(job_id, request.query))
        thread.daemon = True
        thread.start()
        
        print(f"Background thread started for job: {job_id}")
        
        return AsyncRouteResponse(
            job_id=job_id,
            status="pending", 
            message="Route analysis started. Use /route/status/{job_id} to check progress."
        )
        
    except Exception as e:
        print(f"Error creating job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error starting route analysis: {str(e)}")

# JOB STATUS CHECK
@app.get("/route/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of an async route analysis job"""
    print(f"Checking status for job_id: {job_id}")
    print(f"Available jobs: {list(jobs.keys())}")
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    print(f"Job data: {job}")
    
    # Calculate elapsed time
    current_time = time.time()
    if job["start_time"]:
        elapsed_time = current_time - job["start_time"]
    else:
        elapsed_time = current_time - job["created_time"]
    
    # Estimate progress (rough approximation)
    progress = None
    if job["status"] == "processing":
        # Rough estimate: assume 30-60 seconds for completion
        progress = min(0.9, elapsed_time / 45.0)  # Cap at 90% until actually done
    elif job["status"] == "completed":
        progress = 1.0
    elif job["status"] == "failed":
        progress = 0.0
    
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        result=job.get("result"),
        error=job.get("error"),
        progress=progress,
        elapsed_time=elapsed_time
    )

# SYNCHRONOUS ROUTE RESPONSE (Legacy - with timeout warning)
@app.post("/response", response_model=RouteResponse)
async def route_response(request: RouteRequest):
    """Legacy synchronous route response endpoint - may timeout for complex queries"""
    try:
        # Add timeout warning in response
        start_time = time.time()
        
        response: WorkflowRunResponse = route_workflow.run(request.query)
        
        # Extract the actual response content from the workflow response
        if hasattr(response, 'content') and response.content:
            response_content = response.content
        elif hasattr(response, 'messages') and response.messages:
            # Get the last message content
            response_content = response.messages[-1].content if response.messages else str(response)
        else:
            response_content = str(response)
        
        elapsed_time = time.time() - start_time
        
        # Add performance note if it took a while
        if elapsed_time > 10:
            response_content += f"\n\n⚠️ Note: This analysis took {elapsed_time:.1f} seconds. Consider using the async endpoint /route/analyze for better user experience."
        
        return {"response": response_content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing route request: {str(e)}")

# CLEANUP OLD JOBS (Utility endpoint)
@app.delete("/jobs/cleanup")
async def cleanup_old_jobs():
    """Clean up completed jobs older than 1 hour"""
    current_time = time.time()
    old_jobs = []
    
    for job_id, job in jobs.items():
        job_age = current_time - job["created_time"]
        if job_age > 3600 and job["status"] in ["completed", "failed"]:  # 1 hour
            old_jobs.append(job_id)
    
    for job_id in old_jobs:
        del jobs[job_id]
    
    return {"message": f"Cleaned up {len(old_jobs)} old jobs", "active_jobs": len(jobs)}

# DEBUG: LIST ALL JOBS
@app.get("/jobs/list")
async def list_jobs():
    """List all active jobs - for debugging"""
    return {"jobs": {job_id: {k: v for k, v in job.items() if k != "result"} for job_id, job in jobs.items()}}


if __name__ == "__main__":

    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
    )