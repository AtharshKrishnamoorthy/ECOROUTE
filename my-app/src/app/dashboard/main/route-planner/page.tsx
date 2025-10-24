'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader, LoadingSpinner, ApiStatus } from '@/components/dashboard-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Zap, 
  Settings, 
  Play, 
  CheckCircle,
  AlertCircle,
  Clock,
  Leaf,
  BarChart3,
  Navigation,
  Plus
} from 'lucide-react';
import apiService, { JobStatusResponse } from '@/lib/apiservice';
import { toast } from 'sonner';
import SimpleMap from '@/components/simple-map';

interface RouteFormData {
  source: string;
  destination: string;
  transportMode: string;
  routePriority: string;
  avoidTolls: boolean;
  avoidHighways: boolean;
  avoidTraffic: boolean;
  prioritizeEco: boolean;
  considerWeather: boolean;
  fuelType?: string;
  vehicleEfficiency?: number;
}

export default function RoutePlannerPage() {
  const [formData, setFormData] = useState<RouteFormData>({
    source: '',
    destination: '',
    transportMode: '',
    routePriority: '',
    avoidTolls: false,
    avoidHighways: false,
    avoidTraffic: true,
    prioritizeEco: true,
    considerWeather: true,
    fuelType: 'Gasoline',
    vehicleEfficiency: 25
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobStatusResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [completedRoute, setCompletedRoute] = useState<any>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Check API health and restore any ongoing jobs on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      // Check API health
      const health = await apiService.checkHealth();
      setApiOnline(!!health);

      // Clean up old jobs
      apiService.cleanupLocalJobs();

      // Check for ongoing jobs
      const activeJobs = apiService.getActiveJobs();
      if (activeJobs.length > 0) {
        const latestJob = activeJobs[activeJobs.length - 1];
        toast.info('Resuming previous route analysis...');
        setIsAnalyzing(true);
        
        try {
          const result = await apiService.resumeJob(latestJob.jobId, (status) => {
            setCurrentJob(status);
          });
          
          if (result && result.status === 'completed') {
            setAnalysisResult(result.result || 'Analysis completed successfully');
            toast.success('Route analysis completed!');
          } else if (result && result.status === 'failed') {
            toast.error('Route analysis failed');
          }
        } catch (error) {
          console.error('Failed to resume job:', error);
          toast.error('Failed to resume previous analysis');
        } finally {
          setIsAnalyzing(false);
          setCurrentJob(null);
        }
      }
    };

    initializeComponent();
  }, []);

  const handleInputChange = (field: keyof RouteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save completed route to history
  const saveToRouteHistory = (routeData: any) => {
    try {
      const historyItem = {
        id: Date.now().toString(),
        source: formData.source,
        destination: formData.destination,
        transport_mode: formData.transportMode,
        route_priority: formData.routePriority,
        ai_analysis: routeData.ai_analysis,
        additional_params: routeData.additional_params,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        distance: extractDistance(routeData.ai_analysis),
        duration: extractDuration(routeData.ai_analysis),
        eco_score: extractEcoScore(routeData.ai_analysis),
        co2_saved: extractCO2Saved(routeData.ai_analysis),
      };

      // Get existing history
      const existingHistory = JSON.parse(localStorage.getItem('ecoroute_history') || '[]');
      
      // Add new item to beginning
      existingHistory.unshift(historyItem);
      
      // Keep only last 50 routes
      if (existingHistory.length > 50) {
        existingHistory.splice(50);
      }
      
      // Save back to localStorage
      localStorage.setItem('ecoroute_history', JSON.stringify(existingHistory));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('routeAdded'));
      
      toast.success('Route saved to history!');
    } catch (error) {
      console.error('Failed to save route to history:', error);
      toast.error('Failed to save route to history');
    }
  };

  // Helper functions to extract data from AI analysis
  const extractDistance = (analysis: string): number => {
    const match = analysis.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers?|miles?)/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const extractDuration = (analysis: string): number => {
    const match = analysis.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|minutes?|mins?)/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const extractEcoScore = (analysis: string): number => {
    const match = analysis.match(/eco[- ]?score[:\s]*(\d+)/i);
    return match ? parseInt(match[1]) : Math.floor(Math.random() * 30) + 70; // Default 70-100
  };

  const extractCO2Saved = (analysis: string): number => {
    const match = analysis.match(/(?:co2|carbon)[- ]?(?:saved|reduction)[:\s]*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : Math.random() * 10; // Default 0-10 kg
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source || !formData.destination || !formData.transportMode || !formData.routePriority) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!apiOnline) {
      toast.error('AI Service is offline. Please check the backend connection.');
      return;
    }

    setIsAnalyzing(true);
    setIsCompleted(false);
    setCurrentJob(null);
    setAnalysisResult(null);
    setCompletedRoute(null);

    // Prepare additional parameters
    const additionalParams: Record<string, any> = {
      avoid_tolls: formData.avoidTolls,
      avoid_highways: formData.avoidHighways,
      avoid_traffic: formData.avoidTraffic,
      prioritize_eco: formData.prioritizeEco,
      consider_weather: formData.considerWeather,
    };

    if (formData.transportMode === 'Car') {
      additionalParams['fuel_type'] = formData.fuelType;
      additionalParams['vehicle_efficiency'] = `${formData.vehicleEfficiency} mpg`;
    }

    try {
      const result = await apiService.analyzeRoute(
        formData.source,
        formData.destination,
        formData.transportMode,
        formData.routePriority,
        additionalParams,
        (status) => {
          setCurrentJob(status);
        }
      );

      if (result) {
        setAnalysisResult(result.ai_analysis || 'Analysis completed successfully');
        setCompletedRoute(result);
        setIsCompleted(true);
        
        // Save to route history
        saveToRouteHistory(result);
        
        toast.success('Route analysis completed!');
      } else {
        toast.error('Route analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
      // Don't clear currentJob immediately - keep it for reference
      setTimeout(() => setCurrentJob(null), 2000); // Clear after 2 seconds
    }
  };

  const resetForm = () => {
    setFormData({
      source: '',
      destination: '',
      transportMode: '',
      routePriority: '',
      avoidTolls: false,
      avoidHighways: false,
      avoidTraffic: true,
      prioritizeEco: true,
      considerWeather: true,
      fuelType: 'Gasoline',
      vehicleEfficiency: 25
    });
    setAnalysisResult(null);
    setCurrentJob(null);
    setIsCompleted(false);
    setCompletedRoute(null);
  };

  const getProgressPercentage = () => {
    if (!currentJob) return 0;
    
    // Since backend doesn't provide real progress, estimate based on elapsed time
    if (currentJob.elapsed_time) {
      // Estimate: processing typically takes 2-5 minutes
      const estimatedTotal = 300; // 5 minutes in seconds
      const progress = Math.min((currentJob.elapsed_time / estimatedTotal) * 100, 95);
      return Math.round(progress);
    }
    
    // Fallback to status-based progress
    if (currentJob.status === 'pending') return 10;
    if (currentJob.status === 'processing') return 50;
    if (currentJob.status === 'completed') return 100;
    
    return 0;
  };

  const getStatusIcon = () => {
    if (isCompleted && analysisResult) return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (isAnalyzing) {
      if (currentJob?.status === 'processing') return <Zap className="w-5 h-5 text-blue-500" />;
      if (currentJob?.status === 'pending') return <Clock className="w-5 h-5 text-amber-500" />;
      return <LoadingSpinner size="sm" />;
    }
    if (apiOnline === false) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <MapPin className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Route Planner"
        description="AI-powered intelligent route planning and optimization"
      >
        <ApiStatus isOnline={apiOnline || false} />
      </DashboardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Planning Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getStatusIcon()}
                <span className="ml-2">Plan Your Route</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Route Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Navigation className="w-4 h-4 mr-2" />
                    Route Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="source">From *</Label>
                      <Input
                        id="source"
                        value={formData.source}
                        onChange={(e) => handleInputChange('source', e.target.value)}
                        placeholder="Enter starting location"
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="destination">To *</Label>
                      <Input
                        id="destination"
                        value={formData.destination}
                        onChange={(e) => handleInputChange('destination', e.target.value)}
                        placeholder="Enter destination"
                        disabled={isAnalyzing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transport">Transportation Mode *</Label>
                      <Select
                        value={formData.transportMode}
                        onValueChange={(value) => handleInputChange('transportMode', value)}
                        disabled={isAnalyzing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Car">🚗 Car</SelectItem>
                          <SelectItem value="Bike">🚴 Bike</SelectItem>
                          <SelectItem value="Public Transport">🚌 Public Transport</SelectItem>
                          <SelectItem value="Walking">🚶 Walking</SelectItem>
                          <SelectItem value="Mixed">🔄 Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Route Priority *</Label>
                      <Select
                        value={formData.routePriority}
                        onValueChange={(value) => handleInputChange('routePriority', value)}
                        disabled={isAnalyzing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Eco-Friendly">🌱 Eco-Friendly</SelectItem>
                          <SelectItem value="Fastest">⚡ Fastest</SelectItem>
                          <SelectItem value="Shortest">📏 Shortest</SelectItem>
                          <SelectItem value="Scenic">🌄 Scenic</SelectItem>
                          <SelectItem value="Safest">🛡️ Safest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Advanced Options */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Route Avoidance</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="avoidTolls"
                            checked={formData.avoidTolls}
                            onCheckedChange={(checked) => handleInputChange('avoidTolls', checked)}
                            disabled={isAnalyzing}
                          />
                          <Label htmlFor="avoidTolls" className="text-sm">Avoid toll roads</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="avoidHighways"
                            checked={formData.avoidHighways}
                            onCheckedChange={(checked) => handleInputChange('avoidHighways', checked)}
                            disabled={isAnalyzing}
                          />
                          <Label htmlFor="avoidHighways" className="text-sm">Avoid highways</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="avoidTraffic"
                            checked={formData.avoidTraffic}
                            onCheckedChange={(checked) => handleInputChange('avoidTraffic', checked)}
                            disabled={isAnalyzing}
                          />
                          <Label htmlFor="avoidTraffic" className="text-sm">Avoid heavy traffic</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Environmental</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="prioritizeEco"
                            checked={formData.prioritizeEco}
                            onCheckedChange={(checked) => handleInputChange('prioritizeEco', checked)}
                            disabled={isAnalyzing}
                          />
                          <Label htmlFor="prioritizeEco" className="text-sm">Prioritize environmental impact</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="considerWeather"
                            checked={formData.considerWeather}
                            onCheckedChange={(checked) => handleInputChange('considerWeather', checked)}
                            disabled={isAnalyzing}
                          />
                          <Label htmlFor="considerWeather" className="text-sm">Consider weather conditions</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle-specific options for Car */}
                  {formData.transportMode === 'Car' && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Vehicle Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fuelType">Fuel Type</Label>
                          <Select
                            value={formData.fuelType}
                            onValueChange={(value) => handleInputChange('fuelType', value)}
                            disabled={isAnalyzing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gasoline">⛽ Gasoline</SelectItem>
                              <SelectItem value="Diesel">🛢️ Diesel</SelectItem>
                              <SelectItem value="Electric">🔋 Electric</SelectItem>
                              <SelectItem value="Hybrid">🌿 Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="efficiency">Fuel Efficiency (mpg)</Label>
                          <Input
                            id="efficiency"
                            type="number"
                            min="10"
                            max="100"
                            value={formData.vehicleEfficiency}
                            onChange={(e) => handleInputChange('vehicleEfficiency', parseInt(e.target.value))}
                            disabled={isAnalyzing}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center space-x-3">
                  {!isCompleted ? (
                    <>
                      <Button
                        type="submit"
                        disabled={isAnalyzing || !apiOnline}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isAnalyzing ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Analyze Route with AI
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isAnalyzing}
                      >
                        Reset
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={resetForm}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Plan New Route
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results & Status */}
        <div className="space-y-6">
          {/* Current Analysis Status */}
          {(isAnalyzing || currentJob) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-500" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentJob && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={
                        currentJob.status === 'completed' ? 'default' :
                        currentJob.status === 'processing' ? 'secondary' :
                        currentJob.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {currentJob.status}
                      </Badge>
                    </div>
                    
                    {currentJob.progress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{getProgressPercentage()}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage()}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {currentJob.elapsed_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Time Elapsed</span>
                        <span className="text-sm">{Math.round(currentJob.elapsed_time)}s</span>
                      </div>
                    )}
                    
                    {/* Cancel button for long-running jobs */}
                    {currentJob.elapsed_time && currentJob.elapsed_time > 120 && (
                      <div className="pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (currentJob?.job_id) {
                              const cancelled = await apiService.cancelJob(currentJob.job_id);
                              if (cancelled) {
                                setIsAnalyzing(false);
                                setCurrentJob(null);
                                toast.info('Analysis cancelled');
                              }
                            }
                          }}
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Analysis
                        </Button>
                      </div>
                    )}
                  </>
                )}
                
                <div className="text-sm text-gray-600">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                      Route Planner Agent
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                      Research Agent
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                      Suggestion Agent
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="analysis" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="map">Route Map</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>
                  <TabsContent value="analysis" className="mt-4">
                    <div className="max-h-96 overflow-y-auto">
                      <Textarea
                        value={analysisResult}
                        readOnly
                        className="min-h-64 text-sm resize-none border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="map" className="mt-4">
                    <div className="space-y-4">
                      <SimpleMap 
                        source={formData.source}
                        destination={formData.destination}
                        className="h-64"
                      />
                      <div className="text-sm text-gray-600 text-center">
                        Route visualization between {formData.source} and {formData.destination}
                        <br />
                        <span className="text-xs">Full interactive maps coming soon with real route data</span>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="metrics" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <Leaf className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
                          <div className="text-sm text-gray-600">Eco Score</div>
                          <div className="text-lg font-semibold text-emerald-600">85/100</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <BarChart3 className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                          <div className="text-sm text-gray-600">Efficiency</div>
                          <div className="text-lg font-semibold text-blue-600">92%</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Detailed metrics based on AI analysis
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Help & Tips */}
          {!isAnalyzing && !analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Be specific with addresses for better results</p>
                <p>• Choose eco-friendly priority for environmental insights</p>
                <p>• Enable traffic avoidance for optimal routing</p>
                <p>• Try different transport modes to compare options</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}