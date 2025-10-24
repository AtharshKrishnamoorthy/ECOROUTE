'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = 'default',
  className
}: MetricCardProps) {
  const variantStyles = {
    default: "border-gray-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    warning: "border-amber-200 bg-amber-50",
    danger: "border-red-200 bg-red-50"
  };

  const iconStyles = {
    default: "text-gray-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600"
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {trend && (
          <p className="text-xs text-gray-500 mt-1">
            <span className={trend.positive ? "text-emerald-600" : "text-red-600"}>
              {trend.value}
            </span>
          </p>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  children,
  className
}: DashboardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}

interface ApiStatusProps {
  isOnline: boolean;
  activeJobs?: number;
  className?: string;
}

export function ApiStatus({ isOnline, activeJobs = 0, className }: ApiStatusProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn(
        "h-2 w-2 rounded-full",
        isOnline ? "bg-emerald-500" : "bg-red-500"
      )} />
      <span className="text-sm text-gray-600">
        AI Service: {isOnline ? 'Online' : 'Offline'}
        {isOnline && activeJobs > 0 && ` (${activeJobs} active)`}
      </span>
    </div>
  );
}

interface RouteCardProps {
  route: {
    source: string;
    destination: string;
    transport_mode: string;
    route_priority: string;
    timestamp: string;
    ai_analysis?: string;
  };
  onView?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function RouteCard({ route, onView, onDelete, className }: RouteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransportIcon = (mode: string) => {
    const icons = {
      'Car': '🚗',
      'Bike': '🚴',
      'Public Transport': '🚌',
      'Walking': '🚶',
      'Mixed': '🔄'
    };
    return icons[mode as keyof typeof icons] || '🗺️';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'Eco-Friendly': 'bg-emerald-100 text-emerald-800',
      'Fastest': 'bg-blue-100 text-blue-800',
      'Shortest': 'bg-purple-100 text-purple-800',
      'Scenic': 'bg-orange-100 text-orange-800',
      'Safest': 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getTransportIcon(route.transport_mode)}</span>
              <h3 className="font-semibold text-gray-900 truncate">
                {route.source} → {route.destination}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {route.transport_mode}
              </Badge>
              <Badge className={cn("text-xs", getPriorityColor(route.route_priority))}>
                {route.route_priority}
              </Badge>
            </div>
            
            <p className="text-xs text-gray-500">
              {formatDate(route.timestamp)}
            </p>
            
            {route.ai_analysis && (
              <Badge variant="outline" className="mt-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                AI Analyzed ✨
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {onView && (
              <button
                onClick={onView}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                title="View details"
              >
                👁️
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete route"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600",
        sizeClasses[size]
      )} />
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}