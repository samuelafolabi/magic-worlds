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
      <div className="mb-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 capitalize">
          MARKET CONTEXT AND POSITIONING
        </h3>
        <p className="text-sm italic text-[#d2a64e] dark:text-[#d2a64e]">
          Leading the Metaverse Revolution
        </p>
      </div>
      
      {/* Grid layout: paragraphs on left, Magic Worlds card on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Two paragraph cards */}
        <div className="space-y-6">
          {/* Market Context Paragraph */}
          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 p-5 border border-zinc-200/50 dark:border-zinc-700/50">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              In the vast digital universe, Magic Worlds rises as a beacon of player-driven vitality when several older playgrounds are starting to lose momentum. While established giants cling to fading hype with under 500 daily actives and tokens trading at $0.18 amid a 95% plunge from peaks, our ecosystem surges: 80 daily logins, 1.14x monthly player growth, and 73% social spikes. They are larger, but their communities are less active and their growth is slowing.
            </p>
          </div>

          {/* Community Philosophy Paragraph */}
          <div className="rounded-xl bg-zinc-50/80 dark:bg-zinc-800/50 p-5 border border-zinc-200/50 dark:border-zinc-700/50">
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              The community grows because players shape it, not because they buy their way in. Participation is open, energy comes from the community, and activity keeps rising. Tokens here reward true effort, fueling charity quests and AI insights that blend play with purpose. We empower co-creators through governance and innovation, turning imagination into enduring prosperity. While others flatten out, Magic Worlds continues to build a future driven by people, creativity, and shared progress.
            </p>
          </div>
        </div>
        
        {/* Right column: Magic Worlds card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#40b0bf]/10 via-[#d2a64e]/10 to-[#04d27f]/10 p-6 border-2 border-[#40b0bf]/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#40b0bf]/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h4 className="text-lg font-bold bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] bg-clip-text text-transparent mb-4">
            Magic Worlds
          </h4>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Daily Actives</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {data.magic_worlds.daily_actives}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Growth Trend</p>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {data.magic_worlds.growth_trend}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Social Trend</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {data.magic_worlds.social_trend}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Token Utility</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {data.magic_worlds.token_utility}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
