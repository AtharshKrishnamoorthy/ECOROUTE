'use client';

import { useState, useEffect } from 'react';
import { 
  DashboardHeader, 
  MetricCard, 
  ApiStatus, 
  RouteCard, 
  EmptyState 
} from '@/components/dashboard-components';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Zap, 
  Leaf, 
  BarChart3, 
  TrendingUp,
  Clock,
  Plus,
  ExternalLink
} from 'lucide-react';
import apiService, { HealthStatus } from '@/lib/apiservice';
import Link from 'next/link';

// Mock data for development - replace with real data later
const mockRoutes = [
  {
    source: 'Times Square, New York',
    destination: 'Central Park, New York',
    transport_mode: 'Bike',
    route_priority: 'Eco-Friendly',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    ai_analysis: 'Optimized route with 25% CO2 reduction...'
  },
  {
    source: 'San Francisco Airport',
    destination: 'Golden Gate Bridge',
    transport_mode: 'Public Transport',
    route_priority: 'Fastest',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    ai_analysis: 'Multi-modal route analysis complete...'
  },
  {
    source: 'Los Angeles',
    destination: 'Santa Monica',
    transport_mode: 'Car',
    route_priority: 'Scenic',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  }
];

export default function HomePage() {
  const [apiHealth, setApiHealth] = useState<HealthStatus | null>(null);
  const [routes] = useState(mockRoutes); // Replace with real route data later
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkApiHealth = async () => {
      setIsLoading(true);
      const health = await apiService.checkHealth();
      setApiHealth(health);
      setIsLoading(false);
    };

    checkApiHealth();
    
    // Check API health every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRoutes = routes.length;
  const aiAnalyzedRoutes = routes.filter(route => route.ai_analysis).length;
  const recentRoutes = routes.slice(0, 3);
  const estimatedCO2Saved = totalRoutes * 2.5; // Mock calculation
  const transportModes = new Set(routes.map(route => route.transport_mode)).size;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Welcome back! 👋"
        description="Here's your EcoRoute dashboard overview"
      >
        <div className="flex items-center space-x-3">
          <ApiStatus 
            isOnline={!!apiHealth} 
            activeJobs={apiHealth?.jobs_active || 0}
          />
          <Link href="/dashboard/main/route-planner">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              New Route
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Routes Analyzed"
          value={totalRoutes}
          icon={MapPin}
          trend={{
            value: `+${Math.min(totalRoutes, 3)} this session`,
            positive: true
          }}
          variant="default"
        />
        
        <MetricCard
          title="AI Analyses"
          value={`${aiAnalyzedRoutes}/${totalRoutes}`}
          icon={Zap}
          description="Intelligent route optimization"
          variant="success"
        />
        
        <MetricCard
          title="CO₂ Saved"
          value={`${estimatedCO2Saved.toFixed(1)} kg`}
          icon={Leaf}
          description="vs. non-optimized routes"
          variant="success"
        />
        
        <MetricCard
          title="Transport Modes"
          value={transportModes}
          icon={BarChart3}
          description="variety explored"
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Routes</CardTitle>
              <Link href="/dashboard/main/route-history">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentRoutes.length > 0 ? (
                <div className="space-y-4">
                  {recentRoutes.map((route, index) => (
                    <RouteCard
                      key={index}
                      route={route}
                      onView={() => console.log('View route:', route)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No routes yet"
                  description="Start planning your first eco-friendly route!"
                  icon={<MapPin className="w-12 h-12" />}
                  action={{
                    label: "Plan Your First Route",
                    onClick: () => window.location.href = "/dashboard/main/route-planner"
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          {/* Environmental Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-emerald-600" />
                Environmental Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Routes Optimized</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    {totalRoutes}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CO₂ Reduction</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    ~{(estimatedCO2Saved * 0.1).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Eco Score</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    {Math.min(100, 70 + totalRoutes * 2)}/100
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  This week's progress
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalRoutes / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {totalRoutes}/10 routes to unlock Pro insights
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Status & Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                AI Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Route Planner</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${apiHealth ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-500">
                      {apiHealth ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Research Agent</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${apiHealth ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-500">
                      {apiHealth ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Suggestion Agent</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${apiHealth ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-gray-500">
                      {apiHealth ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {apiHealth && apiHealth.jobs_active > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center text-sm text-blue-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {apiHealth.jobs_active} active analysis
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <Link href="/dashboard/main/route-planner">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Start New Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}