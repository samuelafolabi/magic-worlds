import React from "react";
import MainLayout from "@/layouts/MainLayout";
import StatCard from "@/components/StatCard";
import SocialMediaChart from "@/components/SocialMediaChart";
import SocialMediaReachPieChart from "@/components/SocialMediaReachPieChart";
import ActivityMetricsChart from "@/components/ActivityMetricsChart";
import KeyEventsTimeline from "@/components/KeyEventsTimeline";
import MarketComparison from "@/components/MarketComparison";
import StrategicGoals from "@/components/StrategicGoals";
import reportData from "@/utils/report-data.json";

export default function Home() {
  // Prepare social media data for chart
  const socialMediaData = reportData.social_media_performance.platforms.map(
    (platform) => ({
      platform: platform.platform,
      growth_percentage: platform.growth_percentage,
      followers: platform.followers,
    })
  );

  // Prepare activity metrics data
  const activityData = [
    { name: "Avg Daily", value: reportData.drivers_of_growth.activity_metrics.average_daily_logins },
    { name: "High Score", value: reportData.drivers_of_growth.activity_metrics.high_score },
    { name: "Peak Score", value: reportData.drivers_of_growth.activity_metrics.leaderboard_peak },
  ];

  return (
    <MainLayout
      title="Dashboard - Magic Worlds"
      description="Magic Worlds Monthly Report Dashboard - Track growth, engagement, and community impact"
    >
      {/* Hero Section with Gradient Background */}
      <div className="mt-6"/>
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-12 overflow-hidden rounded-b-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 px-4 sm:px-6 lg:px-8 py-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-sm font-medium text-white">
              {reportData.report_metadata.period}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {reportData.report_metadata.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 font-medium mb-6">
            {reportData.report_metadata.theme}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Monthly Growth</p>
              <p className="text-2xl font-bold text-white">
                {reportData.drivers_of_growth.activity_metrics.monthly_player_growth_factor}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Daily Active Users</p>
              <p className="text-2xl font-bold text-white">
                {reportData.drivers_of_growth.activity_metrics.average_daily_logins}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Peak Score</p>
              <p className="text-2xl font-bold text-white">
                {reportData.drivers_of_growth.activity_metrics.leaderboard_peak.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Highlights - KPI Cards */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Executive Highlights
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Key performance indicators for this period
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportData.executive_highlights.metrics.map((metric, index) => (
            <StatCard
              key={index}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              trend={metric.trend}
              icon={
                index === 0 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : index === 1 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ) : index === 2 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              }
            />
          ))}
        </div>
      </section>

      {/* Performance Analytics */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Performance Analytics
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Social media growth and player activity trends
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SocialMediaChart data={socialMediaData} />
          <SocialMediaReachPieChart data={reportData.social_media_performance.platforms} />
          <ActivityMetricsChart data={activityData} />
        </div>

        {/* Social Media Platform Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData.social_media_performance.platforms.map((platform, index) => (
            <div
              key={index}
              className="group rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {platform.platform}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {platform.handle}
                  </p>
                  {platform.role && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">
                      {platform.role}
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-2 shadow-lg shadow-purple-500/30">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                    {typeof platform.growth_percentage === 'number' ? platform.growth_percentage.toLocaleString() : platform.growth_percentage}%
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">growth</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Followers</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {platform.followers.toLocaleString()}
                  </span>
                </div>
                
                {platform.views_reach && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Views/Reach</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.views_reach.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.views && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Views</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.views.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.reach && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Reach</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.reach.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.interactions && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Interactions</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.interactions.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.content_count && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Content</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.content_count.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.posts && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Posts</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.posts.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.visits && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Visits</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {platform.visits.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {platform.visit_growth && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">Visit Growth</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {platform.visit_growth}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two Column Layout: Market Positioning & Key Events */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketComparison data={reportData.market_positioning.comparison} />
          <KeyEventsTimeline events={reportData.executive_highlights.key_events} />
        </div>
      </section>

      {/* Product Evolution & Purpose */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Evolution */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-3 shadow-lg shadow-purple-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Product Evolution
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {reportData.product_evolution.version} Release
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.product_evolution.key_features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Purpose Beyond Growth */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 border-2 border-purple-500/20 dark:border-purple-500/30 p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Purpose Beyond Growth
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 uppercase tracking-wide">
                  Focus Area
                </p>
                <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                  {reportData.purpose_beyond_growth.focus_area}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1 uppercase tracking-wide">
                  Primary Initiative
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {reportData.purpose_beyond_growth.primary_initiative}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                  Methods
                </p>
                <div className="flex flex-wrap gap-2">
                  {reportData.purpose_beyond_growth.methods.map((method, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-sm italic text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  "{reportData.purpose_beyond_growth.philosophy}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drivers of Growth */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Drivers of Growth
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Key initiatives powering our expansion
            </p>
          </div>
        </div>
        
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportData.drivers_of_growth.initiatives.map((initiative, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                      {initiative.category.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        {initiative.category}
                      </h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {initiative.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Goals */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Forward Outlook
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Strategic goals for the coming months
            </p>
          </div>
        </div>
        
        <StrategicGoals goals={reportData.forward_outlook.strategic_goals} />
      </section>

      {/* Unique Value Proposition - Full Width Banner */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 p-12 shadow-2xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 mb-4">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-white">What Makes Us Different</span>
            </div>
            
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Our Unique Value Proposition
            </h3>
            
            <p className="text-xl text-white/90 leading-relaxed">
              {reportData.market_positioning.unique_value_prop}
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
