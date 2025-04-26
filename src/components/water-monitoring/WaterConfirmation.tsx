
import React from "react";
import { ChevronDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const data = [
  { name: "Nov", value: 36.8 },
  { name: "Dec", value: 34.5 },
  { name: "Jan", value: 38.2 },
  { name: "Feb", value: 35.1 },
  { name: "Mar", value: 37.4 },
];

const previousReadings = [
  { month: "January 2025", reading: "38.2", amount: "573.00" },
  { month: "December 2024", reading: "34.5", amount: "517.50" },
  { month: "November 2024", reading: "36.8", amount: "552.00" },
  { month: "October 2024", reading: "35.1", amount: "526.50" },
  { month: "September 2024", reading: "37.4", amount: "561.00" },
  { month: "August 2024", reading: "33.9", amount: "508.50" },
];

const WaterConfirmation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[#212529] mb-6">History</h2>

      {/* Previous Readings Card */}
      <div className="bg-white rounded-3xl shadow-sm mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-t-3xl">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Previous Readings</h3>
                <p className="text-sm text-blue-100">All readings</p>
              </div>
              <CollapsibleTrigger className="text-white">
                <ChevronDown className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
            </div>
            
            <div className="px-6 pt-4 pb-6 -mx-6 -mb-6 bg-white rounded-b-3xl">
              {/* Always show first 3 readings */}
              <div className="space-y-4">
                {previousReadings.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-[#212529]">{item.month}</p>
                      <p className="text-sm text-gray-500">Reading: {item.reading} m³</p>
                    </div>
                    <p className="text-lg font-semibold text-[#212529]">₱{item.amount}</p>
                  </div>
                ))}
              </div>
              
              {/* Collapsible content for remaining readings */}
              <CollapsibleContent>
                <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
                  {previousReadings.slice(3).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#212529]">{item.month}</p>
                        <p className="text-sm text-gray-500">Reading: {item.reading} m³</p>
                      </div>
                      <p className="text-lg font-semibold text-[#212529]">₱{item.amount}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>

      {/* Water Usage Trend Card */}
      <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-[#212529] mb-4">Water Usage Trend</h3>
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => `${value}m³`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Average Usage:</span>
            <span className="font-medium">36.5 m³/month</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Trend:</span>
            <span className="text-green-500">-2.3% vs last month</span>
          </div>
        </div>
      </div>

      {/* Previous Images Card */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#212529]">Previous Images</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square rounded-xl bg-gray-100">
              <img
                className="w-full h-full rounded-xl object-cover"
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/6bab943db1-5f4b9c2bb46841d6e087.png"
                alt="water meter reading"
              />
              <p className="text-xs text-gray-500 mt-1">
                {new Date(2025, 0 - index, 15).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaterConfirmation;
