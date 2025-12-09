import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

export default function StatsCard({ title, value, description, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {(description || trend) && (
          <div className="flex items-center mt-1 text-xs">
            {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />}
            <span className={`font-medium ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {trendValue}
            </span>
            <span className="text-gray-500 ml-1">{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}