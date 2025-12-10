import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';

export default function StatsCard({ title, value, description, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
    green: "bg-green-50 text-green-600 ring-1 ring-green-100",
    red: "bg-red-50 text-red-600 ring-1 ring-red-100",
    orange: "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
    purple: "bg-purple-50 text-purple-600 ring-1 ring-purple-100",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-slate-200 group">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
          {title}
        </CardTitle>
        <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
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