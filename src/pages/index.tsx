import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import StatCard from "@/components/StatCard";
import SocialMediaChart from "@/components/SocialMediaChart";
import SocialMediaReachPieChart from "@/components/SocialMediaReachPieChart";
import ActivityMetricsChart from "@/components/ActivityMetricsChart";
import KeyEventsTimeline from "@/components/KeyEventsTimeline";
import MarketComparison from "@/components/MarketComparison";
import StrategicGoals from "@/components/StrategicGoals";
import novReportData from "@/utils/nov-report-data.json";
import decReportData from "@/utils/dec-report-data.json";

const toNumber = (value: unknown) =>
  typeof value === "number" ? value : Number(value) || 0;

const formatNumber = (value: unknown): string => {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value || "N/A";
  return "N/A";
};

export default function Home() {
  type ReportData = (typeof novReportData | typeof decReportData) & {
    executive_snapshot?: typeof decReportData.executive_snapshot;
    executive_highlights?: typeof novReportData.executive_highlights;
  };

  const reportsByYear: Record<string, Record<string, ReportData>> = {
    "2025": {
      november: novReportData,
      december: decReportData,
    },
  };

  const earliestYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () =>
      Array.from({ length: currentYear - earliestYear + 1 }, (_, index) =>
        (earliestYear + index).toString()
      ),
    [currentYear]
  );

  const availableYears = Object.keys(reportsByYear);
  const defaultYear =
    availableYears[availableYears.length - 1] ?? yearOptions[0] ?? "2025";

  const getMonthKeys = (year: string) => Object.keys(reportsByYear[year] ?? {});
  const defaultMonthList = getMonthKeys(defaultYear);
  const defaultMonth = defaultMonthList[defaultMonthList.length - 1] || "";

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  useEffect(() => {
    const months = getMonthKeys(selectedYear);
    if (months.length === 0) {
      setSelectedMonth(defaultMonth);
      return;
    }
    if (!months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1]);
    }
  }, [selectedYear, selectedMonth, defaultMonth]);

  const formatMonthLabel = (label?: string) => {
    if (!label) return "";
    const parts = label.split(" ");
    const maybeYear = parts[parts.length - 1];
    if (/^[0-9]{4}$/.test(maybeYear)) {
      return parts.slice(0, -1).join(" ");
    }
    return label;
  };

  const monthOptions = useMemo(() => {
    const months = getMonthKeys(selectedYear);
    if (months.length === 0 && reportsByYear[defaultYear]?.[defaultMonth]) {
      return [
        {
          value: defaultMonth,
          label: `${formatMonthLabel(
            reportsByYear[defaultYear][defaultMonth].report_metadata.period
          )} (default)`,
        },
      ];
    }
    return months.map((monthKey) => ({
      value: monthKey,
      label:
        formatMonthLabel(
          reportsByYear[selectedYear]?.[monthKey]?.report_metadata?.period
        ) || monthKey,
    }));
  }, [selectedYear, defaultMonth, defaultYear]);

  const selectedReport =
    reportsByYear[selectedYear]?.[selectedMonth] ??
    reportsByYear[defaultYear]?.[defaultMonth] ??
    novReportData;
  const reportData = selectedReport;
  const isDecember =
    selectedMonth?.toLowerCase() === "december" ||
    reportData.report_metadata.period?.toLowerCase()?.includes("december");

  const periodSelectors = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2.5 shadow-sm shadow-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <button
          type="button"
          aria-label="Select month"
          onClick={() => setIsMonthModalOpen(true)}
          className="cursor-pointer appearance-none bg-transparent text-sm font-medium text-white focus:outline-none pr-2 inline-flex items-center gap-2"
        >
          <span>
            {monthOptions.find((m) => m.value === selectedMonth)?.label ||
              selectedMonth}
          </span>
          <svg
            className="pointer-events-none h-4 w-4 text-white opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 9l6 6 6-6"
            />
          </svg>
        </button>
      </div>

      <div className="relative inline-flex items-center">
        <button
          type="button"
          aria-label="Select year"
          onClick={() => setIsYearModalOpen(true)}
          className="cursor-pointer appearance-none rounded-full bg-white/25 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white focus:outline-none shadow-sm shadow-white/10 inline-flex items-center gap-2"
        >
          <span>{selectedYear}</span>
          <svg
            className="pointer-events-none h-4 w-4 text-white opacity-80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 9l6 6 6-6"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setIsYearModalOpen(false);
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setIsMonthModalOpen(false);
  };

  const keyEventItems = [
    ...(reportData.key_events?.product_launches || []),
    ...(reportData.key_events?.world_updates || []),
    ...(reportData.key_events?.engagement_spikes || []),
    ...(reportData.key_events?.community_moments || []),
  ];

  // Prepare social media data for chart
  const socialMediaData = reportData.social_media_performance.platforms.map(
    (platform) => ({
      platform: platform.platform,
      growth_percentage: toNumber(platform.growth_percentage),
      followers: toNumber(platform.followers),
    })
  );

  // Prepare activity metrics data
  const activityData = [
    {
      name: "Avg Daily",
      value: toNumber(
        reportData.drivers_of_growth.activity_metrics.average_daily_logins
      ),
    },
    {
      name: "High Score",
      value: toNumber(reportData.drivers_of_growth.activity_metrics.high_score),
    },
    {
      name: "Peak Score",
      value: toNumber(
        reportData.drivers_of_growth.activity_metrics.leaderboard_peak
      ),
    },
  ];

  return (
    <MainLayout
      title="Dashboard - Magic Worlds"
      description="Magic Worlds Monthly Report Dashboard - Track growth, engagement, and community impact"
      headerRight={periodSelectors}
    >
      {/* Hero Section with Gradient Background */}
      <div className="mt-6" />
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-12 overflow-hidden rounded-b-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 px-4 sm:px-6 lg:px-8 py-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
            {reportData.report_metadata.period ||
              reportData.report_metadata.title}
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-semibold mb-4">
            {reportData.report_metadata.title}
          </p>

          <p className="text-xl md:text-2xl text-white/90 font-medium mb-6">
            {reportData.report_metadata.theme}
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Monthly Growth</p>
              <p className="text-2xl font-bold text-white">
                {
                  reportData.drivers_of_growth.activity_metrics
                    .monthly_player_growth_factor
                }
              </p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Daily Active Users</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(
                  reportData.drivers_of_growth.activity_metrics
                    .average_daily_logins
                )}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Peak Score</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(
                  reportData.drivers_of_growth.activity_metrics.leaderboard_peak
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isMonthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setIsMonthModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200/60 dark:border-zinc-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Select Month
              </h3>
              <button
                type="button"
                aria-label="Close month selection"
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                onClick={() => setIsMonthModalOpen(false)}
              >
                <svg
                  className="h-5 w-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
              {monthOptions.map((month) => (
                <button
                  key={month.value}
                  type="button"
                  className={`w-full text-left px-5 py-3 cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                    month.value === selectedMonth
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-200 font-semibold"
                      : "text-zinc-800 dark:text-zinc-100"
                  }`}
                  onClick={() => handleMonthSelect(month.value)}
                >
                  {month.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isYearModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setIsYearModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200/60 dark:border-zinc-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Select Year
              </h3>
              <button
                type="button"
                aria-label="Close year selection"
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                onClick={() => setIsYearModalOpen(false)}
              >
                <svg
                  className="h-5 w-5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={`w-full text-left px-5 py-3 cursor-pointer transition hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                    year === selectedYear
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-200 font-semibold"
                      : "text-zinc-800 dark:text-zinc-100"
                  }`}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Executive Snapshot */}
      {reportData.executive_snapshot && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Executive Snapshot
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                A crisp overview of this period’s movement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Biggest Percentage Lifts
              </h3>
              {reportData.executive_snapshot.biggest_percentage_lifts.length ? (
                <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.executive_snapshot.biggest_percentage_lifts.map(
                    (item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No data yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Fastest-growing Indices
                </h3>
                {reportData.executive_snapshot.fastest_growing_indices
                  .length ? (
                  <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.executive_snapshot.fastest_growing_indices.map(
                      (item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No data yet.
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                  Headline Moment
                </p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {reportData.executive_snapshot.headline_moment ||
                    "No headline yet."}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                  Summary
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {reportData.executive_snapshot.summary ||
                    "Summary forthcoming."}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Executive Highlights - KPI Cards */}
      {reportData.executive_highlights && (
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
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : index === 1 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  ) : index === 2 ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-sm">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Creator/Player Interactions
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {reportData.social_media_performance
                .interaction_increase_percentage || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-sm">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Top Content Themes
            </p>
            <div className="flex flex-wrap gap-2">
              {reportData.social_media_performance.top_content_themes
                ?.length ? (
                reportData.social_media_performance.top_content_themes.map(
                  (theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300"
                    >
                      {theme}
                    </span>
                  )
                )
              ) : (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  No themes yet.
                </span>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-4 shadow-sm">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Notable Spikes
            </p>
            <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {reportData.social_media_performance.notable_spikes?.length ? (
                reportData.social_media_performance.notable_spikes.map(
                  (item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </div>
                  )
                )
              ) : (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  No spikes recorded.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SocialMediaChart data={socialMediaData} />
          <SocialMediaReachPieChart
            data={reportData.social_media_performance.platforms}
          />
          <ActivityMetricsChart data={activityData} />
        </div>

        {/* Social Media Platform Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData.social_media_performance.platforms.map(
            (platform, index) => (
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
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
                      {`${formatNumber(platform.growth_percentage)}%`}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      growth
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Followers
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatNumber(platform.followers)}
                    </span>
                  </div>

                  {platform.views_reach && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Views/Reach
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.views_reach)}
                      </span>
                    </div>
                  )}

                  {platform.views && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Views
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.views)}
                      </span>
                    </div>
                  )}

                  {platform.reach && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Reach
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.reach)}
                      </span>
                    </div>
                  )}

                  {platform.interactions && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Interactions
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.interactions)}
                      </span>
                    </div>
                  )}

                  {platform.content_count && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Content
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.content_count)}
                      </span>
                    </div>
                  )}

                  {platform.posts && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Posts
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.posts)}
                      </span>
                    </div>
                  )}

                  {platform.visits && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Visits
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(platform.visits)}
                      </span>
                    </div>
                  )}

                  {platform.visit_growth && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Visit Growth
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {platform.visit_growth}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* Top World Performance */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Top World Performance
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Growth momentum and engagement across worlds
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Ranked Growth
            </h3>
            {reportData.top_world_performance.top_worlds_ranked.length ? (
              <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
                {reportData.top_world_performance.top_worlds_ranked.map(
                  (item, index) => (
                    <li key={index}>{item}</li>
                  )
                )}
              </ol>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No rankings yet.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Population Shift
              </p>
              <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {reportData.top_world_performance.population_shift.length ? (
                  reportData.top_world_performance.population_shift.map(
                    (item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>{item}</span>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    No data yet.
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Working Index Movement
              </p>
              <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {reportData.top_world_performance.working_index_movement
                  .length ? (
                  reportData.top_world_performance.working_index_movement.map(
                    (item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                        <span>{item}</span>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    No data yet.
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Engagement Lift
              </p>
              <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {reportData.top_world_performance.engagement_lift.length ? (
                  reportData.top_world_performance.engagement_lift.map(
                    (item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    No data yet.
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Personality Reads
              </p>
              <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {reportData.top_world_performance.world_personality_reads
                  .length ? (
                  reportData.top_world_performance.world_personality_reads.map(
                    (item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pink-500" />
                        <span>{item}</span>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    No reads yet.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Layout: Market Positioning & Key Events */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketComparison
            data={reportData.market_positioning.comparison as any}
          />
          <KeyEventsTimeline
            events={
              keyEventItems.length
                ? keyEventItems
                : reportData.executive_highlights?.key_events || []
            }
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
              Happiness / Longevity
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {reportData.market_positioning.growth_indices.happiness_longevity
                .percentage_change || "—"}
            </p>
            <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {reportData.market_positioning.growth_indices.happiness_longevity
                .industry_comparison.length ? (
                reportData.market_positioning.growth_indices.happiness_longevity.industry_comparison.map(
                  (item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>{item}</span>
                    </div>
                  )
                )
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                  No comparisons yet.
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
              Economy Size / Sustainability
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {reportData.market_positioning.growth_indices
                .economy_size_sustainability.economic_activity_growth_rate ||
                "—"}
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {reportData.market_positioning.growth_indices
                .economy_size_sustainability.sustainability_score_movement ||
                "Awaiting update."}
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
              Population / Working Index
            </p>
            <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Population Growth</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {reportData.market_positioning.growth_indices
                    .population_working_index.population_growth || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Productive-user Shift</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {reportData.market_positioning.growth_indices
                    .population_working_index.productive_user_ratio_shift ||
                    "—"}
                </span>
              </div>
              <div className="space-y-1">
                {reportData.market_positioning.growth_indices
                  .population_working_index.industry_comparison.length ? (
                  reportData.market_positioning.growth_indices.population_working_index.industry_comparison.map(
                    (item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                        <span>{item}</span>
                      </div>
                    )
                  )
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                    No comparisons yet.
                  </span>
                )}
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
            {reportData.drivers_of_growth.initiatives.map(
              (initiative, index) => (
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
              )
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/50 dark:border-zinc-700/50">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                Platform Behaviors
              </p>
              {reportData.drivers_of_growth.platform_behaviors.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.drivers_of_growth.platform_behaviors.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No entries yet.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/50 dark:border-zinc-700/50">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                Viral Loops & Social
              </p>
              {reportData.drivers_of_growth.viral_loops.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.drivers_of_growth.viral_loops.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-pink-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No entries yet.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/50 dark:border-zinc-700/50">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                B2B Activity
              </p>
              {reportData.drivers_of_growth.b2b_activity.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.drivers_of_growth.b2b_activity.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No entries yet.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/50 dark:border-zinc-700/50">
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                Player Sentiment
              </p>
              {reportData.drivers_of_growth.player_sentiment_themes.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.drivers_of_growth.player_sentiment_themes.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No entries yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Evolution & Purpose */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Evolution */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-3 shadow-lg shadow-purple-500/30">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
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
              {reportData.product_evolution.key_features.map(
                (feature, index) => (
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
                )
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                  Top Products by Growth
                </p>
                {reportData.product_evolution.top_products_by_growth.length ? (
                  <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.product_evolution.top_products_by_growth.map(
                      (item, index) => (
                        <li key={index} className="flex gap-2 items-start">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No entries yet.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                  Features Gaining Traction
                </p>
                {reportData.product_evolution.traction_features.length ? (
                  <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.product_evolution.traction_features.map(
                      (item, index) => (
                        <li key={index} className="flex gap-2 items-start">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No entries yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                  Usage Curves
                </p>
                {reportData.product_evolution.usage_curves.length ? (
                  <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.product_evolution.usage_curves.map(
                      (item, index) => (
                        <li key={index} className="flex gap-2 items-start">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No entries yet.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                  Emerging / Beta Products
                </p>
                {reportData.product_evolution.emerging_products.length ? (
                  <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.product_evolution.emerging_products.map(
                      (item, index) => (
                        <li key={index} className="flex gap-2 items-start">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No entries yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Purpose Beyond Growth */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 border-2 border-purple-500/20 dark:border-purple-500/30 p-8 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
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
                  {reportData.purpose_beyond_growth.methods.map(
                    (method, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      >
                        {method}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <p className="text-sm italic text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  "{reportData.purpose_beyond_growth.philosophy}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Impact Participation Growth
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {reportData.purpose_beyond_growth
                      .impact_participation_growth || "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Impact Movement
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.purpose_beyond_growth
                      .impact_movement_expression || "Awaiting update."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Charity & Community Achievements
                  </p>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.purpose_beyond_growth
                      .charity_and_community_achievements.length ? (
                      reportData.purpose_beyond_growth.charity_and_community_achievements.map(
                        (item, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </div>
                        )
                      )
                    ) : (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        No achievements yet.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Player-driven Initiatives
                  </p>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.purpose_beyond_growth.player_driven_initiatives
                      .length ? (
                      reportData.purpose_beyond_growth.player_driven_initiatives.map(
                        (item, index) => (
                          <div key={index} className="flex gap-2 items-start">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                            <span>{item}</span>
                          </div>
                        )
                      )
                    ) : (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        No initiatives yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Strategic Goals
            </h3>
            <StrategicGoals
              goals={reportData.forward_outlook.strategic_goals}
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Momentum Indices
              </p>
              {reportData.forward_outlook.momentum_indices.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.forward_outlook.momentum_indices.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No momentum signals yet.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Q1 Predictions
              </p>
              {reportData.forward_outlook.q1_predictions.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.forward_outlook.q1_predictions.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No predictions yet.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Worlds to Watch
              </p>
              {reportData.forward_outlook.worlds_to_watch.length ? (
                <div className="flex flex-wrap gap-2">
                  {reportData.forward_outlook.worlds_to_watch.map(
                    (item, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No watchlist yet.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                Early Signals
              </p>
              {reportData.forward_outlook.early_signals.length ? (
                <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.forward_outlook.early_signals.map(
                    (item, index) => (
                      <li key={index} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No signals yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Unique Value Proposition - Full Width Banner */}
      {!isDecember && (
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 p-12 shadow-2xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 mb-4">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="text-sm font-medium text-white">
                  What Makes Us Different
                </span>
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
      )}
    </MainLayout>
  );
}
