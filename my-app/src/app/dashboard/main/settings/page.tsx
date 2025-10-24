'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard-components';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Zap,
  Save,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface UserSettings {
  // Profile
  name: string;
  email: string;
  avatar?: string;
  
  // Preferences
  defaultTransport: string;
  defaultPriority: string;
  units: 'metric' | 'imperial';
  language: string;
  
  // Notifications
  emailNotifications: boolean;
  routeCompleteNotifications: boolean;
  weeklyReport: boolean;
  
  // Privacy
  shareAnalytics: boolean;
  saveRouteHistory: boolean;
  
  // API
  apiEndpoint: string;
  maxRetries: number;
  timeoutSeconds: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    // Profile
    name: 'John Doe',
    email: 'john.doe@example.com',
    
    // Preferences
    defaultTransport: 'Car',
    defaultPriority: 'Eco-Friendly',
    units: 'metric',
    language: 'en',
    
    // Notifications
    emailNotifications: true,
    routeCompleteNotifications: true,
    weeklyReport: false,
    
    // Privacy
    shareAnalytics: true,
    saveRouteHistory: true,
    
    // API
    apiEndpoint: 'http://localhost:8000',
    maxRetries: 3,
    timeoutSeconds: 30
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: Implement actual save logic
    console.log('Saving settings:', settings);
    
    setIsSaving(false);
    setIsDirty(false);
    toast.success('Settings saved successfully!');
  };

  const resetToDefaults = () => {
    setSettings({
      name: 'John Doe',
      email: 'john.doe@example.com',
      defaultTransport: 'Car',
      defaultPriority: 'Eco-Friendly',
      units: 'metric',
      language: 'en',
      emailNotifications: true,
      routeCompleteNotifications: true,
      weeklyReport: false,
      shareAnalytics: true,
      saveRouteHistory: true,
      apiEndpoint: 'http://localhost:8000',
      maxRetries: 3,
      timeoutSeconds: 30
    });
    setIsDirty(true);
    toast.info('Settings reset to defaults');
  };

  const testApiConnection = async () => {
    try {
      const response = await fetch(`${settings.apiEndpoint}/health`);
      if (response.ok) {
        toast.success('API connection successful!');
      } else {
        toast.error('API connection failed - Server error');
      }
    } catch (error) {
      toast.error('API connection failed - Cannot reach server');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <DashboardHeader
        title="Settings"
        description="Manage your account and application preferences"
      >
        <div className="flex items-center space-x-2">
          {isDirty && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{settings.name}</h3>
                  <p className="text-sm text-gray-500">{settings.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Avatar
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleSettingChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Account Status</h4>
                    <p className="text-sm text-gray-500">Free Plan - AI-powered route planning</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2" />
                Default Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Route Defaults</h4>
                  <div>
                    <Label>Default Transportation Mode</Label>
                    <Select
                      value={settings.defaultTransport}
                      onValueChange={(value) => handleSettingChange('defaultTransport', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>Default Route Priority</Label>
                    <Select
                      value={settings.defaultPriority}
                      onValueChange={(value) => handleSettingChange('defaultPriority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                <div className="space-y-4">
                  <h4 className="font-medium">Display Settings</h4>
                  <div>
                    <Label>Units</Label>
                    <Select
                      value={settings.units}
                      onValueChange={(value) => handleSettingChange('units', value as 'metric' | 'imperial')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (km, kg)</SelectItem>
                        <SelectItem value="imperial">Imperial (mi, lb)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Route Analysis Complete</Label>
                    <p className="text-sm text-gray-500">Get notified when AI analysis finishes</p>
                  </div>
                  <Switch
                    checked={settings.routeCompleteNotifications}
                    onCheckedChange={(checked) => handleSettingChange('routeCompleteNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-gray-500">Receive weekly sustainability reports</p>
                  </div>
                  <Switch
                    checked={settings.weeklyReport}
                    onCheckedChange={(checked) => handleSettingChange('weeklyReport', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Analytics</Label>
                    <p className="text-sm text-gray-500">Help improve EcoRoute by sharing anonymous usage data</p>
                  </div>
                  <Switch
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) => handleSettingChange('shareAnalytics', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Save Route History</Label>
                    <p className="text-sm text-gray-500">Store your route history for future reference</p>
                  </div>
                  <Switch
                    checked={settings.saveRouteHistory}
                    onCheckedChange={(checked) => handleSettingChange('saveRouteHistory', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Danger Zone
                </h4>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h5 className="font-medium text-red-800 mb-2">Delete Account</h5>
                  <p className="text-sm text-red-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="apiEndpoint"
                      value={settings.apiEndpoint}
                      onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                      placeholder="http://localhost:8000"
                    />
                    <Button variant="outline" onClick={testApiConnection}>
                      Test
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    URL of your EcoRoute backend API
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxRetries">Max Retries</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxRetries}
                      onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of times to retry failed requests
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="timeoutSeconds">Timeout (seconds)</Label>
                    <Input
                      id="timeoutSeconds"
                      type="number"
                      min="10"
                      max="300"
                      value={settings.timeoutSeconds}
                      onChange={(e) => handleSettingChange('timeoutSeconds', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Request timeout in seconds
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">API Information</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• The EcoRoute API powers AI-driven route analysis</p>
                  <p>• Ensure the backend server is running for full functionality</p>
                  <p>• Default endpoint: http://localhost:8000</p>
                  <p>• Check the console for detailed API logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}