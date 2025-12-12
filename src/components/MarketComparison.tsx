import React from "react";

interface ComparisonData {
  magic_worlds: {
    daily_actives: number;
    growth_trend: string;
    social_trend: string;
    token_utility: string;
  };
  competitors: {
    description: string;
    daily_actives: string;
    token_performance: string;
    growth_trend: string;
  };
}

interface MarketComparisonProps {
  data: ComparisonData;
}

export default function MarketComparison({ data }: MarketComparisonProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Market Positioning
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Magic Worlds */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#40b0bf]/10 via-[#d2a64e]/10 to-[#04d27f]/10 p-6 border-2 border-[#40b0bf]/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#40b0bf]/20 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <h4 className="text-lg font-bold bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] bg-clip-text text-transparent mb-4">
              Magic Worlds
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Daily Actives</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {data.magic_worlds.daily_actives}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Growth Trend</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {data.magic_worlds.growth_trend}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Social Trend</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {data.magic_worlds.social_trend}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Token Utility</p>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {data.magic_worlds.token_utility}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Competitors */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800/50 p-6 border-2 border-zinc-200 dark:border-zinc-700">
          <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            {data.competitors.description}
          </h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Daily Actives</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {data.competitors.daily_actives}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Growth Trend</p>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {data.competitors.growth_trend}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Token Performance</p>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {data.competitors.token_performance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
