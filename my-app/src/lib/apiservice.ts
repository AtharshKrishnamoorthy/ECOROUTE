// API Service for EcoRoute FastAPI Backend Integration
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for API requests and responses
export interface RouteRequest {
  query: string;
}

export interface AsyncRouteResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  progress?: number;
  elapsed_time?: number;
}

export interface HealthStatus {
  status: string;
  jobs_active: number;
}

export interface RouteAnalysis {
  raw_response: string;
  analysis_complete: boolean;
  timestamp: string;
}

export interface RouteData {
  source: string;
  destination: string;
  transport_mode: string;
  route_priority: string;
  ai_analysis?: string;
  additional_params?: any;
  timestamp: string;
  query_used?: string;
  source_coords?: [number, number];
  dest_coords?: [number, number];
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async checkHealth(): Promise<HealthStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return null;
    }
  }

  // Start async route analysis
  async startRouteAnalysis(query: string): Promise<AsyncRouteResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/route/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Route analysis failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Route analysis failed:', error);
      toast.error('Failed to start route analysis');
      return null;
    }
  }

  // Check job status
  async getJobStatus(jobId: string): Promise<JobStatusResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/route/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Job status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Job status check failed:', error);
      return null;
    }
  }

  // Poll job status until completion
  async pollJobStatus(jobId: string, onProgress?: (status: JobStatusResponse) => void): Promise<JobStatusResponse | null> {
    const maxAttempts = 240; // 20 minutes max (5 second intervals) - increased from 5 minutes
    let attempts = 0;

    // Store job in localStorage for persistence across tab switches
    const jobData = {
      jobId,
      startTime: Date.now(),
      source: 'route-planner',
    };
    localStorage.setItem(`ecoroute_job_${jobId}`, JSON.stringify(jobData));

    while (attempts < maxAttempts) {
      const status = await this.getJobStatus(jobId);
      
      if (!status) {
        // Clean up localStorage on failure
        localStorage.removeItem(`ecoroute_job_${jobId}`);
        return null;
      }

      // Call progress callback if provided
      if (onProgress) {
        onProgress(status);
      }

      // Check if job is complete
      if (status.status === 'completed' || status.status === 'failed') {
        // Clean up localStorage on completion
        localStorage.removeItem(`ecoroute_job_${jobId}`);
        return status;
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    // Timeout - keep job in localStorage for potential recovery
    toast.error('Route analysis is taking longer than expected. You can check back later.');
    return null;
  }

  // Legacy synchronous route analysis (for fallback)
  async getSyncRouteAnalysis(query: string): Promise<{ response: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Sync route analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Sync route analysis failed:', error);
      toast.error('Route analysis failed');
      return null;
    }
  }

  // Get active jobs from localStorage
  getActiveJobs(): Array<{jobId: string, startTime: number, source: string}> {
    const jobs = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ecoroute_job_')) {
        try {
          const jobData = JSON.parse(localStorage.getItem(key) || '{}');
          jobs.push(jobData);
        } catch (error) {
          // Remove invalid job data
          localStorage.removeItem(key);
        }
      }
    }
    return jobs;
  }

  // Resume monitoring an existing job
  async resumeJob(jobId: string, onProgress?: (status: JobStatusResponse) => void): Promise<JobStatusResponse | null> {
    const status = await this.getJobStatus(jobId);
    if (!status) {
      // Job not found, clean up
      localStorage.removeItem(`ecoroute_job_${jobId}`);
      return null;
    }

    if (status.status === 'completed' || status.status === 'failed') {
      // Job already finished, clean up
      localStorage.removeItem(`ecoroute_job_${jobId}`);
      return status;
    }

    // Continue polling
    return this.pollJobStatus(jobId, onProgress);
  }

  // Clean up old jobs from localStorage (older than 1 hour)
  cleanupLocalJobs(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ecoroute_job_')) {
        try {
          const jobData = JSON.parse(localStorage.getItem(key) || '{}');
          if (jobData.startTime < oneHourAgo) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Cancel a running job
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      // Clean up localStorage immediately
      localStorage.removeItem(`ecoroute_job_${jobId}`);
      
      // Note: FastAPI backend doesn't have cancel endpoint, 
      // but we can stop polling and clean up client-side
      toast.info('Job cancelled on client side');
      return true;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  // Complete route analysis workflow
  async analyzeRoute(
    source: string,
    destination: string,
    transportMode: string,
    routePriority: string,
    additionalParams?: any,
    onProgress?: (status: JobStatusResponse) => void
  ): Promise<RouteData | null> {
    try {
      // Create comprehensive query
      const query = this.createRouteQuery(source, destination, transportMode, routePriority, additionalParams);

      // Start async analysis
      const startResponse = await this.startRouteAnalysis(query);
      if (!startResponse) {
        return null;
      }

      toast.success('Route analysis started');

      // Poll for completion
      const finalStatus = await this.pollJobStatus(startResponse.job_id, onProgress);
      if (!finalStatus || finalStatus.status !== 'completed') {
        toast.error('Route analysis failed or timed out');
        return null;
      }

      // Create route data object
      const routeData: RouteData = {
        source,
        destination,
        transport_mode: transportMode,
        route_priority: routePriority,
        ai_analysis: finalStatus.result,
        additional_params: additionalParams,
        timestamp: new Date().toISOString(),
        query_used: query,
      };

      toast.success('Route analysis completed successfully!');
      return routeData;

    } catch (error) {
      console.error('Route analysis workflow failed:', error);
      toast.error('Route analysis failed');
      return null;
    }
  }

  // Create comprehensive route query (from app.py)
  private createRouteQuery(
    source: string,
    destination: string,
    transportMode: string,
    routePriority: string,
    additionalParams?: any
  ): string {
    let query = `
Please analyze and plan an eco-friendly route with the following specifications:

**Route Details:**
- From: ${source}
- To: ${destination}
- Transportation Mode: ${transportMode}
- Route Priority: ${routePriority}

**Analysis Requirements:**
1. Find the optimal route considering environmental impact
2. Provide detailed route information including:
   - Total distance and estimated travel time
   - Step-by-step directions
   - Environmental impact analysis (CO2 emissions, fuel consumption)
   - Eco-score rating (0-100)
   - Alternative route options if available

3. Consider factors such as:
   - Real-time traffic conditions
   - Road types and conditions
   - Elevation changes
   - Weather impact
   - Vehicle efficiency (if applicable)

4. Provide recommendations for:
   - Most eco-friendly route option
   - Potential improvements or alternatives
   - Environmental benefits compared to other routes

**Transportation Specific Analysis:`;

    // Add transport-specific parameters
    if (transportMode.toLowerCase() === 'car') {
      query += `
   - Fuel efficiency optimization
   - Traffic pattern analysis
   - Parking availability
   - Toll road considerations`;
    } else if (transportMode.toLowerCase() === 'bike') {
      query += `
   - Bike lane availability
   - Elevation changes and hills
   - Safety considerations
   - Weather impact on cycling`;
    } else if (transportMode.toLowerCase() === 'public transport') {
      query += `
   - Transit schedule optimization
   - Transfer efficiency
   - Cost analysis
   - Accessibility features`;
    } else if (transportMode.toLowerCase() === 'walking') {
      query += `
   - Pedestrian-friendly routes
   - Safety and lighting
   - Weather considerations
   - Points of interest along the way`;
    }

    // Add additional parameters if provided
    if (additionalParams) {
      query += `\n\n**Additional Preferences:**`;
      Object.entries(additionalParams).forEach(([key, value]) => {
        query += `\n- ${key}: ${value}`;
      });
    }

    query += `\n\n**Expected Response Format:**
Please provide a comprehensive analysis including route details, environmental metrics, and actionable recommendations. Focus on both practical routing and environmental consciousness.`;

    return query.trim();
  }

  // Cleanup old jobs
  async cleanupOldJobs(): Promise<{ message: string; active_jobs: number } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/cleanup`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Cleanup failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cleanup failed:', error);
      return null;
    }
  }

  // List all jobs (debug)
  async listJobs(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`List jobs failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List jobs failed:', error);
      return null;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Helper function to parse API response (from app.py)
export function parseApiResponse(apiResponse: string): RouteAnalysis {
  return {
    raw_response: apiResponse,
    analysis_complete: true,
    timestamp: new Date().toISOString(),
  };
}

// Helper function to calculate environmental impact
export function calculateEnvironmentalImpact(distance: number, transportMode: string) {
  const emissionFactors: { [key: string]: number } = {
    Car: 0.2,
    Bike: 0.0,
    'Public Transport': 0.08,
    Walking: 0.0,
    Mixed: 0.1,
  };

  const factor = emissionFactors[transportMode] || 0.2;
  const co2Emissions = distance * factor;

  return {
    distance: Math.round(distance * 100) / 100,
    co2_emissions: Math.round(co2Emissions * 100) / 100,
    fuel_saved: transportMode !== 'Car' ? Math.round(distance * 0.08 * 100) / 100 : 0,
    eco_score: Math.max(0, 100 - Math.floor(co2Emissions * 5)),
  };
}