'use client';

import { useState, useEffect } from 'react';
import { 
  DashboardHeader, 
  RouteCard, 
  EmptyState, 
  MetricCard,
  LoadingSpinner 
} from '@/components/dashboard-components';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  Trash2,
  Eye,
  MapPin,
  Leaf,
  BarChart3,
  TrendingUp,
  Calendar,
  Plus
} from 'lucide-react';
import Link from 'next/link';

// Mock route data - replace with real data later
const mockRoutes = [
  {
    id: '1',
    source: 'Times Square, New York',
    destination: 'Central Park, New York',
    transport_mode: 'Bike',
    route_priority: 'Eco-Friendly',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ai_analysis: 'Optimized bike route through Central Park with 25% CO2 reduction compared to driving. Estimated time: 45 minutes. Features dedicated bike lanes for 80% of the route with minimal elevation changes. Weather conditions: Clear, ideal for cycling.',
    distance: 5.2,
    co2_saved: 2.1,
    eco_score: 95
  },
  {
    id: '2',
    source: 'San Francisco Airport',
    destination: 'Golden Gate Bridge',
    transport_mode: 'Public Transport',
    route_priority: 'Fastest',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    ai_analysis: 'Multi-modal route combining BART and Muni bus services. Total journey time: 1 hour 15 minutes with one transfer. Environmental benefits: 70% less CO2 than driving. Real-time transit optimization included.',
    distance: 18.7,
    co2_saved: 5.6,
    eco_score: 78
  },
  {
    id: '3',
    source: 'Los Angeles Downtown',
    destination: 'Santa Monica Pier',
    transport_mode: 'Car',
    route_priority: 'Scenic',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    ai_analysis: 'Scenic coastal route via Pacific Coast Highway. Increased travel time for enhanced experience. Fuel-efficient route optimization reduces emissions by 15% compared to fastest route.',
    distance: 24.1,
    co2_saved: 1.2,
    eco_score: 65
  },
  {
    id: '4',
    source: 'Boston Common',
    destination: 'Harvard University',
    transport_mode: 'Walking',
    route_priority: 'Safest',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ai_analysis: 'Pedestrian-optimized route through well-lit areas with wide sidewalks. Total walking time: 1 hour 30 minutes. Zero emissions, maximum health benefits. Weather-resistant route with covered passages available.',
    distance: 4.8,
    co2_saved: 0,
    eco_score: 100
  },
  {
    id: '5',
    source: 'Chicago O\'Hare',
    destination: 'Navy Pier',
    transport_mode: 'Mixed',
    route_priority: 'Eco-Friendly',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    distance: 19.5,
    co2_saved: 4.2,
    eco_score: 82
  }
];

export default function RouteHistoryPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [transportFilter, setTransportFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load routes from localStorage on component mount
  useEffect(() => {
    const loadRoutes = () => {
      try {
        const savedRoutes = JSON.parse(localStorage.getItem('ecoroute_history') || '[]');
        setRoutes(savedRoutes);
        setFilteredRoutes(savedRoutes);
      } catch (error) {
        console.error('Failed to load route history:', error);
        // Fallback to empty array if localStorage is corrupted
        setRoutes([]);
        setFilteredRoutes([]);
      }
    };

    loadRoutes();

    // Listen for route history updates (when new routes are added)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ecoroute_history') {
        loadRoutes();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from same tab
    const handleRouteAdded = () => loadRoutes();
    window.addEventListener('routeAdded', handleRouteAdded);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('routeAdded', handleRouteAdded);
    };
  }, []);

  // Filter and search routes
  useEffect(() => {
    let filtered = routes;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(route =>
        route.source.toLowerCase().includes(searchLower) ||
        route.destination.toLowerCase().includes(searchLower) ||
        route.transport_mode.toLowerCase().includes(searchLower) ||
        route.route_priority.toLowerCase().includes(searchLower)
      );
    }

    // Apply transport filter
    if (transportFilter !== 'All') {
      filtered = filtered.filter(route => route.transport_mode === transportFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'All') {
      filtered = filtered.filter(route => route.route_priority === priorityFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'Most Recent':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'Oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'Source A-Z':
          return a.source.localeCompare(b.source);
        case 'Destination A-Z':
          return a.destination.localeCompare(b.destination);
        case 'Highest Eco Score':
          return (b.eco_score || 0) - (a.eco_score || 0);
        case 'Most Distance':
          return (b.distance || 0) - (a.distance || 0);
        default:
          return 0;
      }
    });

    setFilteredRoutes(filtered);
  }, [routes, searchTerm, transportFilter, priorityFilter, sortBy]);

  const handleViewRoute = (route: any) => {
    setSelectedRoute(route);
    setShowDetails(true);
  };

  const handleDeleteRoute = (routeId: string) => {
    setRoutes(prev => prev.filter(route => route.id !== routeId));
    toast.success('Route deleted successfully');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setTransportFilter('All');
    setPriorityFilter('All');
    setSortBy('Most Recent');
  };

  const exportRoutes = () => {
    try {
      const dataStr = JSON.stringify(filteredRoutes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ecoroute-history.json';
      link.click();
      toast.success('Routes exported successfully');
    } catch (error) {
      toast.error('Failed to export routes');
    }
  };

  // Calculate summary statistics
  const totalRoutes = routes.length;
  const totalDistance = routes.reduce((sum, route) => sum + (route.distance || 0), 0);
  const totalCO2Saved = routes.reduce((sum, route) => sum + (route.co2_saved || 0), 0);
  const avgEcoScore = routes.length > 0 
    ? routes.reduce((sum, route) => sum + (route.eco_score || 0), 0) / routes.length 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Route History"
        description="View and manage your analyzed routes"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={exportRoutes}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/main/route-planner">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              New Route
            </Button>
          </Link>
        </div>
      </DashboardHeader>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Routes"
          value={totalRoutes}
          icon={MapPin}
          variant="default"
        />
        <MetricCard
          title="Distance Planned"
          value={`${totalDistance.toFixed(1)} km`}
          icon={BarChart3}
          variant="default"
        />
        <MetricCard
          title="CO₂ Saved"
          value={`${totalCO2Saved.toFixed(1)} kg`}
          icon={Leaf}
          variant="success"
        />
        <MetricCard
          title="Avg Eco Score"
          value={`${avgEcoScore.toFixed(0)}/100`}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={transportFilter} onValueChange={setTransportFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transport Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Modes</SelectItem>
                <SelectItem value="Car">🚗 Car</SelectItem>
                <SelectItem value="Bike">🚴 Bike</SelectItem>
                <SelectItem value="Public Transport">🚌 Public Transport</SelectItem>
                <SelectItem value="Walking">🚶 Walking</SelectItem>
                <SelectItem value="Mixed">🔄 Mixed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="Eco-Friendly">🌱 Eco-Friendly</SelectItem>
                <SelectItem value="Fastest">⚡ Fastest</SelectItem>
                <SelectItem value="Shortest">📏 Shortest</SelectItem>
                <SelectItem value="Scenic">🌄 Scenic</SelectItem>
                <SelectItem value="Safest">🛡️ Safest</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Most Recent">Most Recent</SelectItem>
                <SelectItem value="Oldest">Oldest</SelectItem>
                <SelectItem value="Source A-Z">Source A-Z</SelectItem>
                <SelectItem value="Destination A-Z">Destination A-Z</SelectItem>
                <SelectItem value="Highest Eco Score">Highest Eco Score</SelectItem>
                <SelectItem value="Most Distance">Most Distance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || transportFilter !== 'All' || priorityFilter !== 'All' || sortBy !== 'Most Recent') && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {filteredRoutes.length} of {totalRoutes} routes
                </span>
                {searchTerm && <Badge variant="outline">Search: {searchTerm}</Badge>}
                {transportFilter !== 'All' && <Badge variant="outline">{transportFilter}</Badge>}
                {priorityFilter !== 'All' && <Badge variant="outline">{priorityFilter}</Badge>}
              </div>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routes List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <History className="w-5 h-5 mr-2" />
            Route History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRoutes.length > 0 ? (
            <div className="space-y-4">
              {filteredRoutes.map((route) => (
                <div key={route.id} className="relative">
                  <RouteCard
                    route={route}
                    onView={() => handleViewRoute(route)}
                    onDelete={() => handleDeleteRoute(route.id)}
                  />
                  {/* Additional metrics for route history */}
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 ml-4">
                    {route.distance && (
                      <span className="flex items-center">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {route.distance} km
                      </span>
                    )}
                    {route.co2_saved !== undefined && (
                      <span className="flex items-center">
                        <Leaf className="w-3 h-3 mr-1" />
                        {route.co2_saved} kg CO₂ saved
                      </span>
                    )}
                    {route.eco_score && (
                      <span className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Eco Score: {route.eco_score}/100
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No routes found"
              description={searchTerm || transportFilter !== 'All' || priorityFilter !== 'All' 
                ? "Try adjusting your filters to see more routes" 
                : "Start planning your first route to see it here"}
              icon={<History className="w-12 h-12" />}
              action={{
                label: searchTerm || transportFilter !== 'All' || priorityFilter !== 'All' 
                  ? "Clear Filters" 
                  : "Plan Your First Route",
                onClick: searchTerm || transportFilter !== 'All' || priorityFilter !== 'All' 
                  ? clearAllFilters 
                  : () => window.location.href = "/dashboard/main/route-planner"
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Route Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRoute && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  {selectedRoute.source} → {selectedRoute.destination}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="analysis" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">AI Route Analysis</h4>
                      <Textarea
                        value={selectedRoute.ai_analysis || 'No analysis available'}
                        readOnly
                        className="min-h-64 resize-none border-0 p-0 bg-transparent focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="metrics" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <BarChart3 className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <div className="text-sm text-gray-600">Distance</div>
                      <div className="text-lg font-semibold">{selectedRoute.distance || 'N/A'} km</div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <Leaf className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                      <div className="text-sm text-gray-600">CO₂ Saved</div>
                      <div className="text-lg font-semibold">{selectedRoute.co2_saved || 0} kg</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <div className="text-sm text-gray-600">Eco Score</div>
                      <div className="text-lg font-semibold">{selectedRoute.eco_score || 'N/A'}/100</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <Calendar className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <div className="text-sm text-gray-600">Planned</div>
                      <div className="text-lg font-semibold">
                        {new Date(selectedRoute.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Route Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">From:</span>
                            <span>{selectedRoute.source}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">To:</span>
                            <span>{selectedRoute.destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transport:</span>
                            <Badge variant="outline">{selectedRoute.transport_mode}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Priority:</span>
                            <Badge variant="outline">{selectedRoute.route_priority}</Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Analysis Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span>{new Date(selectedRoute.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">AI Analysis:</span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              {selectedRoute.ai_analysis ? 'Complete' : 'Not Available'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}