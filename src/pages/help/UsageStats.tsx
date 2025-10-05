import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LineChart, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from 'lucide-react';

const UsageStats = () => {
  const navigate = useNavigate();

  const chartTypes = [
    {
      title: "Reading Comparison",
      description: "Compare your current reading with the previous one",
      icon: BarChart3,
      color: "blue"
    },
    {
      title: "Usage Change",
      description: "See the increase or decrease from your last reading",
      icon: LineChart,
      color: "green"
    },
    {
      title: "Reading History",
      description: "View your meter readings over time",
      icon: PieChart,
      color: "purple"
    }
  ];

  const insights = [
    {
      title: "Peak Usage Times",
      description: "Identify when you use the most utilities",
      icon: TrendingUp,
      tip: "Most usage typically occurs in the evening between 6-9 PM"
    },
    {
      title: "Low Usage Periods",
      description: "Find opportunities to optimize consumption",
      icon: TrendingDown,
      tip: "Consider scheduling high-energy tasks during off-peak hours"
    },
    {
      title: "Historical Comparison",
      description: "Compare current usage with previous periods",
      icon: Calendar,
      tip: "Look for seasonal patterns and improvement opportunities"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f7] relative">
      <div className="px-6 pb-32">
        <div className="flex justify-between items-center mb-8 pt-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/help')} 
              className="p-2 -ml-2 rounded-lg transition duration-150 hover:bg-gray-200 hover:scale-110 active:scale-95 focus:ring-2 focus:ring-gray-200 outline-none"
              aria-label="Back to Help"
            >
              <ChevronLeft className="text-[#212529] w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-[#212529]">Usage Stats</h1>
          </div>
          <LineChart className="text-[#212529] w-6 h-6" />
        </div>

        <div className="mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4 text-[#212529]">Understanding Your Data</h2>
            <p className="text-gray-600 mb-4">
              Track your utility consumption by comparing your current readings with previous ones to see changes over time.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Chart Types</h3>
            <div className="space-y-4">
              {chartTypes.map((chart, index) => {
                const ChartIcon = chart.icon;
                const colorClasses = {
                  blue: 'bg-gray-100 text-[#212529]',
                  green: 'bg-gray-100 text-[#212529]',
                  purple: 'bg-gray-100 text-[#212529]'
                };
                
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[chart.color as keyof typeof colorClasses]}`}>
                          <ChartIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#212529] mb-2">{chart.title}</h4>
                        <p className="text-gray-600 text-sm">{chart.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-[#212529]">Key Insights</h3>
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const InsightIcon = insight.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <InsightIcon className="w-5 h-5 text-amber-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#212529] mb-2">{insight.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-amber-700 text-sm font-medium">💡 Tip: {insight.tip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-semibold text-[#212529] mb-4">How to Read Your Stats</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#212529] mb-2">Reading Units</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Water: Displayed as shown on your meter</li>
                  <li>• Electricity: Displayed as shown on your meter</li>
                  <li>• Usage Change: Shows increase (+) or decrease (-) from previous reading</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-[#212529] mb-2">Usage Indicators</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• <span className="text-[#212529] font-medium">Arrows ↗</span>: Increase from previous reading</li>
                  <li>• <span className="text-gray-600 font-medium">Arrows ↘</span>: Decrease from previous reading</li>
                  <li>• Numbers show the exact difference between readings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold text-[#212529] mb-4">Saving Tips Based on Your Data</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600 text-sm">Reduce usage during peak hours to lower costs</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600 text-sm">Set usage goals based on your historical data</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600 text-sm">Compare with similar households in your area</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#212529] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600 text-sm">Monitor trends to identify inefficient appliances</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStats;