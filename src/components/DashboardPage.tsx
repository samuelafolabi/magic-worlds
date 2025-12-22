import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import MainLayout from "@/layouts/MainLayout";
import StatCard from "@/components/StatCard";
import SocialMediaChart from "@/components/SocialMediaChart";
import SocialMediaReachPieChart from "@/components/SocialMediaReachPieChart";
import ActivityMetricsChart from "@/components/ActivityMetricsChart";
import MarketComparison from "@/components/MarketComparison";
import novReportData from "@/utils/nov-report-data.json";
import decReportData from "@/utils/dec-report-data.json";
import {
  FaUsers,
  FaTrophy,
  FaBullhorn,
  FaMicrophone,
  FaChartLine,
  FaHeart,
  FaComments,
  FaHandSparkles,
} from "react-icons/fa";

type SocialPlatform =
  (typeof novReportData)["social_media_performance"]["platforms"][number];

type MarketComparisonData = Parameters<typeof MarketComparison>[0]["data"];

const toNumber = (value: unknown) =>
  typeof value === "number" ? value : Number(value) || 0;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function mergeReportData(nov: unknown, dec: unknown): unknown {
  if (Array.isArray(nov) && Array.isArray(dec)) {
    // Prefer December array if it has content; otherwise use November.
    return dec.length > 0 ? dec : nov;
  }

  if (isPlainObject(nov) && isPlainObject(dec)) {
    const out: Record<string, unknown> = { ...nov };
    for (const [key, decVal] of Object.entries(dec)) {
      const novVal = (nov as Record<string, unknown>)[key];
      out[key] = mergeReportData(novVal, decVal);
    }
    return out;
  }

  // Prefer December when it's meaningfully set; otherwise fall back to November.
  if (dec === null || dec === undefined) return nov;
  if (typeof dec === "string" && dec.trim() === "") return nov;
  return dec;
}

const clampNonNegative = (value: unknown) => Math.max(0, toNumber(value));

const round2 = (value: unknown) =>
  Math.round(clampNonNegative(value) * 100) / 100;

const formatPct2 = (value: unknown) => round2(value).toFixed(2);

const getNovBaselinePlatform = (platformName: SocialPlatform["platform"]) =>
  novReportData.social_media_performance.platforms.find(
    (p) => p.platform === platformName
  );

const getPlatformKpi = (platform: SocialPlatform): number => {
  switch (platform.platform) {
    case "Facebook":
      return toNumber(platform.views);
    case "Instagram":
      return toNumber(platform.reach);
    case "YouTube":
      return toNumber(platform.views);
    case "X (Twitter)":
      return toNumber(platform.followers);
    default:
      return 0;
  }
};

const getBaselineKpi = (platformName: SocialPlatform["platform"]): number => {
  const baseline = getNovBaselinePlatform(platformName);
  if (!baseline) return 0;
  return getPlatformKpi(baseline as SocialPlatform);
};

const computeOverallSocialGrowth = (
  platforms: SocialPlatform[]
): number | null => {
  let sum = 0;
  let count = 0;

  for (const p of platforms) {
    const baseline = getBaselineKpi(p.platform);
    if (!Number.isFinite(baseline) || baseline <= 0) continue;

    const current = getPlatformKpi(p);
    if (!Number.isFinite(current)) continue;

    const pct = ((current - baseline) / baseline) * 100;
    const clamped = Math.max(0, pct);

    sum += clamped;
    count += 1;
  }

  if (count <= 0) return null;
  // Display requirement: nearest whole number
  return Math.round(sum / count);
};

const deltaOver5Pct = (current: unknown, baseline: unknown): number | null => {
  const c = toNumber(current);
  const b = toNumber(baseline);
  if (!Number.isFinite(c) || !Number.isFinite(b) || b <= 0) return null;
  const pct = ((c - b) / b) * 100;
  if (pct <= 5) return null;
  return Math.round(pct * 100) / 100;
};

const getDecemberKpi = (platform: SocialPlatform) => {
  if (
    platform.platform === "YouTube" ||
    platform.platform === "Facebook" ||
    platform.platform === "Instagram"
  ) {
    return { label: "views", value: toNumber(platform.views) };
  }
  return { label: "followers", value: toNumber(platform.followers) };
};

const formatNumber = (value: unknown): string => {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value || "N/A";
  return "N/A";
};

// Format number with K notation (e.g., 108400 -> "108.4K")
const formatNumberWithK = (value: unknown): string => {
  if (typeof value === "number") {
    if (value >= 1000) {
      const kValue = value / 1000;
      return `${kValue.toFixed(1)}K`;
    }
    return value.toLocaleString();
  }
  if (typeof value === "string") return value || "N/A";
  return "N/A";
};

// Helper function to get icon for category
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();

  if (
    lowerCategory.includes("internship") ||
    lowerCategory.includes("volunteer")
  ) {
    return FaUsers;
  }
  if (
    lowerCategory.includes("gameplay") ||
    lowerCategory.includes("challenge") ||
    lowerCategory.includes("meetup")
  ) {
    return FaTrophy;
  }
  if (
    lowerCategory.includes("pr") ||
    lowerCategory.includes("merchandise") ||
    lowerCategory.includes("visibility")
  ) {
    return FaBullhorn;
  }
  if (
    lowerCategory.includes("creator") ||
    lowerCategory.includes("space") ||
    lowerCategory.includes("x")
  ) {
    return FaMicrophone;
  }
  if (lowerCategory.includes("activity") || lowerCategory.includes("player")) {
    return FaChartLine;
  }
  if (
    lowerCategory.includes("fundraising") ||
    lowerCategory.includes("community")
  ) {
    return FaHeart;
  }
  if (
    lowerCategory.includes("communication") ||
    lowerCategory.includes("upgrade")
  ) {
    return FaComments;
  }

  // Default icon
  return FaHandSparkles;
};

export type DashboardRouteMode = "root" | "december";

export type DashboardPageProps = {
  initialMonth?: string;
  routeMode?: DashboardRouteMode;
};

export default function DashboardPage({
  initialMonth: initialMonthProp,
  routeMode = "root",
}: DashboardPageProps) {
  const router = useRouter();

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
  const defaultMonth = defaultMonthList.includes("november")
    ? "november"
    : defaultMonthList[defaultMonthList.length - 1] || "";

  const routeForcesDecember = routeMode === "december";
  const queryMonth =
    !routeForcesDecember && typeof router.query.month === "string"
      ? router.query.month.toLowerCase()
      : undefined;

  const initialMonth = (() => {
    if (routeForcesDecember && defaultMonthList.includes("december")) {
      return "december";
    }

    if (queryMonth && defaultMonthList.includes(queryMonth)) {
      return queryMonth;
    }

    const propMonth = typeof initialMonthProp === "string"
      ? initialMonthProp.toLowerCase()
      : undefined;
    if (propMonth && defaultMonthList.includes(propMonth)) {
      return propMonth;
    }

    return defaultMonth;
  })();

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  useEffect(() => {
    if (routeForcesDecember) {
      if (selectedMonth !== "december" && getMonthKeys(selectedYear).includes("december")) {
        setSelectedMonth("december");
      }
      return;
    }

    if (queryMonth && queryMonth !== selectedMonth) {
      const months = getMonthKeys(selectedYear);
      if (months.includes(queryMonth)) {
        setSelectedMonth(queryMonth);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeForcesDecember, queryMonth]);

  useEffect(() => {
    const months = getMonthKeys(selectedYear);
    if (months.length === 0) {
      setSelectedMonth(defaultMonth);
      return;
    }
    if (!months.includes(selectedMonth)) {
      setSelectedMonth(
        months.includes("november") ? "november" : months[months.length - 1]
      );
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
  const baseReportData = selectedReport;
  const isDecember =
    selectedMonth?.toLowerCase() === "december" ||
    baseReportData.report_metadata.period?.toLowerCase()?.includes("december");

  const reportData: ReportData = isDecember
    ? (mergeReportData(
        novReportData as ReportData,
        baseReportData
      ) as ReportData)
    : baseReportData;

  const [decemberSocialPlatforms, setDecemberSocialPlatforms] = useState<
    Array<SocialPlatform | null> | null
  >(null);
  const [decemberSocialLoading, setDecemberSocialLoading] = useState(false);
  const [decemberSocialError, setDecemberSocialError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!isDecember) return;
    let cancelled = false;

    (async () => {
      try {
        setDecemberSocialLoading(true);
        setDecemberSocialError(null);
        const resp = await fetch("/api/report/december-social");
        const json: unknown = await resp.json();
        const payload = json as { error?: unknown; platforms?: unknown };
        if (!resp.ok) {
          throw new Error(
            (typeof payload?.error === "string" && payload.error) ||
              `Failed to fetch December social report: ${resp.status} ${resp.statusText}`
          );
        }
        const platforms = Array.isArray(payload?.platforms)
          ? (payload.platforms as Array<SocialPlatform | null>)
          : null;
        if (!cancelled) setDecemberSocialPlatforms(platforms);
      } catch (e) {
        if (!cancelled) {
          setDecemberSocialError(e instanceof Error ? e.message : String(e));
          setDecemberSocialPlatforms(null);
        }
      } finally {
        if (!cancelled) setDecemberSocialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDecember]);

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
    setIsMonthModalOpen(false);
    const normalized = month.toLowerCase();
    if (normalized === "december") {
      router.push("/december");
      return;
    }
    if (normalized === "november") {
      router.push("/");
      return;
    }
    if (routeMode === "december") {
      router.push({ pathname: "/", query: { month: normalized } });
      return;
    }
    setSelectedMonth(normalized);
  };

  const keyEventItems = [
    ...(reportData.key_events?.product_launches || []),
    ...(reportData.key_events?.world_updates || []),
    ...(reportData.key_events?.engagement_spikes || []),
    ...(reportData.key_events?.community_moments || []),
  ];

  const performancePlatforms =
    isDecember && decemberSocialPlatforms
      ? decemberSocialPlatforms.filter(
          (p): p is SocialPlatform => Boolean(p)
        )
      : reportData.social_media_performance.platforms;

  const overallSocialGrowth =
    isDecember && decemberSocialPlatforms
      ? computeOverallSocialGrowth(
          decemberSocialPlatforms.filter((p): p is SocialPlatform => Boolean(p))
        )
      : null;

  // Prepare social media data for chart
  const socialMediaData = performancePlatforms.map((platform) => ({
    platform: platform.platform,
    growth_percentage: isDecember
      ? round2(platform.growth_percentage)
      : toNumber(platform.growth_percentage),
    followers: toNumber(platform.followers),
  }));

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
      <>
        <div className="mt-6" />
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-12 overflow-hidden rounded-b-3xl bg-gradient-to-br from-[#40b0bf] to-[##d2a64e] px-4 sm:px-6 lg:px-8 py-16">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

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
                <p className="text-sm text-white/70 mb-1">Monthly Growth</p>
                <p className="text-2xl font-bold text-white">
                  {/* 
                      reportData.drivers_of_growth.activity_metrics
                        .monthly_player_growth_factor
                        */}
                  {isDecember && decemberSocialLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                    </span>
                  ) : isDecember && overallSocialGrowth != null ? (
                    `${Math.round(overallSocialGrowth)}%`
                  ) : (
                    "70%"
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
                <p className="text-sm text-white/70 mb-1">New rollout</p>
                <p className="text-2xl font-bold text-white">V5</p>
              </div>
              <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2">
                <p className="text-sm text-white/70 mb-1">Peak Score</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(
                    reportData.drivers_of_growth.activity_metrics
                      .leaderboard_peak
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Modals - Always available */}
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
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
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
                      ? "bg-[#40b0bf]/10 dark:bg-[#40b0bf]/20 text-[#40b0bf] dark:text-[#40b0bf]/80 font-semibold"
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
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
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
                      ? "bg-[#40b0bf]/10 dark:bg-[#40b0bf]/20 text-[#40b0bf] dark:text-[#40b0bf]/80 font-semibold"
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

      {/* Report Content */}
      <>
        {/* Executive Snapshot */}
        {!isDecember && reportData.executive_snapshot && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                  Executive Snapshot
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                  A crisp overview of this period’s movement
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 capitalize">
                  Biggest Percentage Lifts
                </h3>
                {reportData.executive_snapshot.biggest_percentage_lifts
                  .length ? (
                  <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.executive_snapshot.biggest_percentage_lifts.map(
                      (item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#40b0bf] to-[#04d27f]" />
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
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2 capitalize">
                    Fastest-growing Indices
                  </h3>
                  {reportData.executive_snapshot.fastest_growing_indices
                    .length ? (
                    <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {reportData.executive_snapshot.fastest_growing_indices.map(
                        (item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#40b0bf] to-[#04d27f]" />
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Headline Moment
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {reportData.executive_snapshot.headline_moment ||
                      "No headline yet."}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
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
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                  Executive Highlights
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                  Key performance indicators for this period
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* V5 Version Card - Matching StatCard Design */}
              <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                {/* V5 Label with Gradient - Organic Fluid Shape - Top Right */}

                <div className="relative z-10">
                  {/* Header with Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Version
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#40b0bf] via-[#d2a64e] to-[#04d27f] flex items-center justify-center text-white shadow-lg shadow-[#40b0bf]/30">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="mb-2">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] bg-clip-text text-transparent">
                      V5
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    Version 5 rollout on PC and mobile, introducing AI-powered
                    bots that enhance real-world value creation. Socials,
                    amplifying player stories globally.
                  </p>
                </div>

                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>

              {/* Remaining StatCards */}
              {reportData.executive_highlights.metrics
                .slice(1)
                .map((metric, index) => (
                  <StatCard
                    key={index + 1}
                    label={metric.label}
                    value={
                      isDecember && metric.label === "Social Media Growth" ? (
                        decemberSocialLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#40b0bf]/40 border-t-[#40b0bf]" />
                          </span>
                        ) : overallSocialGrowth != null ? (
                          `${Math.round(overallSocialGrowth)}%+`
                        ) : (
                          metric.value
                        )
                      ) : (
                        metric.value
                      )
                    }
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
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
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

        {/* A Living Digital Ecosystem */}
        <section className="mb-16 relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800/50 p-8 md:p-12 lg:p-16">
          {/* Background particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#40b0bf] rounded-full opacity-60 blur-sm animate-pulse" />
            <div
              className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#d2a64e] rounded-full opacity-50 blur-sm animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-[#40b0bf] rounded-full opacity-40 blur-sm animate-pulse"
              style={{ animationDelay: "2s" }}
            />
            <div
              className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-[#d2a64e] rounded-full opacity-50 blur-sm animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
            <div
              className="absolute bottom-1/3 right-1/2 w-1 h-1 bg-[#40b0bf] rounded-full opacity-40 blur-sm animate-pulse"
              style={{ animationDelay: "1.5s" }}
            />
          </div>

          <div className="relative z-10">
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 uppercase tracking-tight">
              A Living Digital Ecosystem
            </h3>

            <h3 className="text-2xl md:text-3xl font-bold text-[#d2a64e] mb-6 capitalize">
              Player Empowerment at the Core
            </h3>

            <div className="space-y-4 text-white text-base md:text-lg leading-relaxed">
              <p>
                Magic Worlds continues to grow as a living digital region
                powered entirely by its community. October and November saw
                stronger cross-world activity, new talent joining the ecosystem,
                and a wave of player-initiated action.
              </p>

              <p>
                From live gameplay sessions to fundraising for disaster relief,
                the economy is being shaped through the daily decisions of
                players who treat Magic Worlds as their own digital territory.
                Engagement rose across multiple platforms, and player activity
                remained healthy as the worlds continued evolving into a more
                fluid, connected space.
              </p>

              <p>
                This growth reflects a maturing ecosystem shaped by players who
                are not just participants but co-builders.
              </p>
            </div>
          </div>
        </section>

        {/* Performance Analytics */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Performance Analytics
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Social media growth and player activity trends
              </p>
            </div>
          </div>

          {isDecember && decemberSocialError && (
            <div className="mb-6 rounded-xl border border-red-200/60 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              Failed to load live December social metrics: {decemberSocialError}
            </div>
          )}

          {isDecember && decemberSocialLoading && !decemberSocialPlatforms && (
            <div className="mb-6 rounded-xl border border-zinc-200/60 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#40b0bf]/40 border-t-[#40b0bf]" />
              </div>
            </div>
          )}

          {!isDecember || decemberSocialPlatforms ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <SocialMediaChart data={socialMediaData} />
              <SocialMediaReachPieChart data={performancePlatforms} />
              <ActivityMetricsChart data={activityData} />
            </div>
          ) : null}

          {/* Social Media Platform Details */}
          {isDecember && decemberSocialLoading && !decemberSocialPlatforms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-sm"
                >
                  <div className="h-4 w-24 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="mt-2 h-3 w-32 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="mt-5 h-8 w-28 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-3 w-5/6 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-3 w-4/6 bg-zinc-200/70 dark:bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performancePlatforms.map((platform, index) => (
                <div
                  key={index}
                  className="group rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {platform.platform}
                      </h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {platform.handle}
                      </p>
                      {platform.role && (
                        <p className="text-sm text-[#40b0bf] dark:text-[#40b0bf]/80 mt-1 italic">
                          {platform.role}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-[#40b0bf] via-[#d2a64e] to-[#04d27f] p-2 shadow-lg shadow-[#40b0bf]/30">
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
                      <span className="text-2xl font-bold bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] bg-clip-text text-transparent">
                        {(() => {
                          const growth = isDecember
                            ? round2(platform.growth_percentage)
                            : toNumber(platform.growth_percentage);

                          if (isDecember && growth < 5) {
                            const kpi = getDecemberKpi(platform);
                            return formatNumberWithK(kpi.value);
                          }

                          return `${
                            isDecember
                              ? formatPct2(growth)
                              : formatNumber(growth)
                          }%`;
                        })()}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {(() => {
                          const growth = isDecember
                            ? round2(platform.growth_percentage)
                            : toNumber(platform.growth_percentage);

                          if (isDecember && growth < 5) {
                            return getDecemberKpi(platform).label;
                          }

                          return "growth";
                        })()}
                      </span>
                    </div>

                    {/* YouTube specific fields */}
                    {platform.platform === "YouTube" && (
                      <>
                        {platform.views && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Views
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumberWithK(platform.views)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.views;
                                  const delta = deltaOver5Pct(
                                    platform.views,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                            </span>
                          </div>
                        )}
                        {platform.videos && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Videos
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumber(platform.videos)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Facebook specific fields */}
                    {platform.platform === "Facebook" && (
                      <>
                        {platform.views && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Views
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumberWithK(platform.views)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.views;
                                  const delta = deltaOver5Pct(
                                    platform.views,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                              {(isDecember
                                ? round2(platform.views_growth) > 0
                                : Boolean(platform.views_growth)) && (
                                <span className="text-[#40b0bf] ml-1">
                                  {" "}
                                  ↑{" "}
                                  {isDecember
                                    ? formatPct2(platform.views_growth)
                                    : platform.views_growth}
                                  %
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {platform.viewers && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Viewers
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumberWithK(platform.viewers)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.viewers;
                                  const delta = deltaOver5Pct(
                                    platform.viewers,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                              {(isDecember
                                ? round2(platform.viewers_growth) > 0
                                : Boolean(platform.viewers_growth)) && (
                                <span className="text-[#40b0bf] ml-1">
                                  {" "}
                                  ↑{" "}
                                  {isDecember
                                    ? formatPct2(platform.viewers_growth)
                                    : platform.viewers_growth}
                                  %
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {platform.visits && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Visits
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumber(platform.visits)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.visits;
                                  const delta = deltaOver5Pct(
                                    platform.visits,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                              {(isDecember
                                ? round2(platform.visit_growth) > 0
                                : Boolean(platform.visit_growth)) && (
                                <span className="text-[#40b0bf] ml-1">
                                  {" "}
                                  ↑{" "}
                                  {isDecember
                                    ? formatPct2(platform.visit_growth)
                                    : platform.visit_growth}
                                  %
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Instagram specific fields */}
                    {platform.platform === "Instagram" && (
                      <>
                        {platform.views && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Views
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumberWithK(platform.views)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.views;
                                  const delta = deltaOver5Pct(
                                    platform.views,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                              {(isDecember
                                ? round2(platform.views_growth) > 0
                                : Boolean(platform.views_growth)) && (
                                <span className="text-[#40b0bf] ml-1">
                                  {" "}
                                  ↑{" "}
                                  {isDecember
                                    ? formatPct2(platform.views_growth)
                                    : platform.views_growth}
                                  %
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {platform.reach && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Reach
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumberWithK(platform.reach)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.reach;
                                  const delta = deltaOver5Pct(
                                    platform.reach,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                              {(isDecember
                                ? round2(platform.reach_growth) > 0
                                : Boolean(platform.reach_growth)) && (
                                <span className="text-[#40b0bf] ml-1">
                                  {" "}
                                  ↑{" "}
                                  {isDecember
                                    ? formatPct2(platform.reach_growth)
                                    : platform.reach_growth}
                                  %
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {platform.visits && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Visits
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumber(platform.visits)}
                              {isDecember &&
                                (() => {
                                  const base = getNovBaselinePlatform(
                                    platform.platform
                                  )?.visits;
                                  const delta = deltaOver5Pct(
                                    platform.visits,
                                    base
                                  );
                                  if (delta == null) return null;
                                  return (
                                    <span className="text-[#40b0bf] ml-1">
                                      {" "}
                                      ↑ {formatPct2(delta)}%
                                    </span>
                                  );
                                })()}
                              {(isDecember
                                ? round2(platform.visit_growth) > 0
                                : Boolean(platform.visit_growth)) && (
                                <span className="text-[#40b0bf] ml-1">
                                  {" "}
                                  ↑{" "}
                                  {isDecember
                                    ? formatPct2(platform.visit_growth)
                                    : formatNumber(platform.visit_growth)}
                                  %
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* X (Twitter) specific fields */}
                    {platform.platform === "X (Twitter)" && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Followers
                          </span>
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            {formatNumber(platform.followers)}
                          </span>
                        </div>
                        {platform.posts && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              Posts
                            </span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumber(platform.posts)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {platform.description && (
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {platform.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top World Performance */}
        {selectedMonth !== "november" && !isDecember && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                  Top World Performance
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                  Growth momentum and engagement across worlds
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 capitalize">
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Population Shift
                  </p>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.top_world_performance.population_shift
                      .length ? (
                      reportData.top_world_performance.population_shift.map(
                        (item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#40b0bf]" />
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Working Index Movement
                  </p>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.top_world_performance.working_index_movement
                      .length ? (
                      reportData.top_world_performance.working_index_movement.map(
                        (item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#04d27f]" />
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
                    Personality Reads
                  </p>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {reportData.top_world_performance.world_personality_reads
                      .length ? (
                      reportData.top_world_performance.world_personality_reads.map(
                        (item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#d2a64e]" />
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
        )}

        {/* Market Positioning */}
        <section className="mb-16">
          <MarketComparison
            data={
              reportData.market_positioning
                .comparison as unknown as MarketComparisonData
            }
          />

          {selectedMonth?.toLowerCase() !== "november" && !isDecember && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                  Happiness / Longevity
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {reportData.market_positioning.growth_indices
                    .happiness_longevity.percentage_change || "—"}
                </p>
                <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.market_positioning.growth_indices
                    .happiness_longevity.industry_comparison.length ? (
                    reportData.market_positioning.growth_indices.happiness_longevity.industry_comparison.map(
                      (item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#40b0bf]" />
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
                <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                  Economy Size / Sustainability
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {reportData.market_positioning.growth_indices
                    .economy_size_sustainability
                    .economic_activity_growth_rate || "—"}
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {reportData.market_positioning.growth_indices
                    .economy_size_sustainability
                    .sustainability_score_movement || "Awaiting update."}
                </p>
              </div>

              <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
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
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#04d27f]" />
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
          )}
        </section>

        {/* Drivers of Growth */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Drivers of Growth
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Key initiatives powering our expansion
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-lg">
            {/* Header Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#d2a64e] mb-4 capitalize">
                Igniting Collective Momentum
              </h3>
              <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Growth this period came from a blend of player activity, new
                community programs, and stronger communication across time
                zones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportData.drivers_of_growth.initiatives.map(
                (initiative, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#40b0bf]/10 to-[#04d27f]/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#40b0bf] via-[#d2a64e] to-[#04d27f] flex items-center justify-center text-white font-bold shadow-lg shadow-[#40b0bf]/30 group-hover:scale-110 transition-transform duration-300">
                          {React.createElement(
                            getCategoryIcon(initiative.category),
                            {
                              className: "w-6 h-6",
                            }
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                            {initiative.category}
                          </h4>
                          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {initiative.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {selectedMonth?.toLowerCase() !== "november" && !isDecember && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/50 dark:border-zinc-700/50">
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                    Platform Behaviors
                  </p>
                  {reportData.drivers_of_growth.platform_behaviors.length ? (
                    <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {reportData.drivers_of_growth.platform_behaviors.map(
                        (item, index) => (
                          <li key={index} className="flex gap-2 items-start">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#40b0bf]" />
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                    Viral Loops & Social
                  </p>
                  {reportData.drivers_of_growth.viral_loops.length ? (
                    <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {reportData.drivers_of_growth.viral_loops.map(
                        (item, index) => (
                          <li key={index} className="flex gap-2 items-start">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#d2a64e]" />
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                    B2B Activity
                  </p>
                  {reportData.drivers_of_growth.b2b_activity.length ? (
                    <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {reportData.drivers_of_growth.b2b_activity.map(
                        (item, index) => (
                          <li key={index} className="flex gap-2 items-start">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#04d27f]" />
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
                  <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                    Player Sentiment
                  </p>
                  {reportData.drivers_of_growth.player_sentiment_themes
                    .length ? (
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
            )}
          </div>
        </section>

        {/* Product Evolution & Purpose */}
        <section className="mb-16 space-y-6">
          {/* Product Evolution */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full bg-gradient-to-br from-[#40b0bf] via-[#d2a64e] to-[#04d27f] p-3 shadow-lg shadow-[#40b0bf]/30">
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
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                  Product Evolution
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {reportData.product_evolution.version} Release
                </p>
              </div>
            </div>

            {"subtitle" in reportData.product_evolution &&
              reportData.product_evolution.subtitle && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-[#d2a64e] mb-2">
                    {reportData.product_evolution.subtitle}
                  </h4>
                  {"description" in reportData.product_evolution &&
                    reportData.product_evolution.description && (
                      <p className="text-base text-zinc-700 dark:text-zinc-300">
                        {reportData.product_evolution.description}
                      </p>
                    )}
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.product_evolution.key_features.map(
                (feature, index) => {
                  const featureTitle =
                    typeof feature === "string" ? feature : feature.title;
                  const featureDescription =
                    typeof feature === "object" ? feature.description : null;

                  return (
                    <div key={index} className="rounded-lg overflow-hidden">
                      <div className="bg-[#40b0bf]/20 dark:bg-[#40b0bf]/30 px-4 py-3 rounded-t-lg">
                        <h5 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {featureTitle}
                        </h5>
                      </div>
                      {featureDescription && (
                        <div className="px-4 py-3 bg-white dark:bg-zinc-900 rounded-b-lg">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">
                            {featureDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {selectedMonth?.toLowerCase() !== "november" && !isDecember && (
              <>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                    <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                      Top Products by Growth
                    </p>
                    {reportData.product_evolution.top_products_by_growth
                      .length ? (
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
                    <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                      Features Gaining Traction
                    </p>
                    {reportData.product_evolution.traction_features.length ? (
                      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {reportData.product_evolution.traction_features.map(
                          (item, index) => (
                            <li key={index} className="flex gap-2 items-start">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#40b0bf]" />
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
                    <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                      Usage Curves
                    </p>
                    {reportData.product_evolution.usage_curves.length ? (
                      <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {reportData.product_evolution.usage_curves.map(
                          (item, index) => (
                            <li key={index} className="flex gap-2 items-start">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#04d27f]" />
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
                    <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
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
              </>
            )}
          </div>

          {/* Purpose Beyond Growth */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black dark:from-black dark:via-zinc-900 dark:to-zinc-800 border border-zinc-700/50 shadow-2xl">
            {/* Starfield Background Effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    backgroundColor:
                      Math.random() > 0.5 ? "#d2a64e" : "#40b0bf",
                    opacity: Math.random() * 0.6 + 0.2,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-3 uppercase tracking-tight">
                  PURPOSE BEYOND GROWTH
                </h3>
                <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400">
                  Creativity Fuels Compassion
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Text */}
                <div className="space-y-6">
                  <p className="text-base text-white leading-relaxed">
                    Magic Worlds continues to show how a digital region can
                    support real people. Empathy unites our ecosystem.
                  </p>

                  {/* Central Image */}
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-cyan-500/30">
                    <Image
                      src="/Screenshot 2025-12-12 220005.png"
                      alt="Hands cradling a glowing heart with ECG pulse"
                      fill
                      className="object-contain"
                      style={{ objectPosition: "center" }}
                    />
                  </div>
                </div>

                {/* Right Side - Content Boxes */}
                <div className="space-y-4">
                  {/* Top Right Box */}
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                    <p className="text-base text-white leading-relaxed">
                      This period&apos;s standout initiative was the fundraising
                      drive for families affected by Typhoon Tino in Cebu.
                      Community members shared donation links, hosted Spaces,
                      and amplified awareness across their networks.
                    </p>
                  </div>

                  {/* Bottom Right Box */}
                  <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                    <p className="text-base text-white leading-relaxed">
                      Alongside this, local meetups and gameplay sessions,
                      funded with small bonuses, helped strengthen offline
                      bonds. These pockets of activity show that Magic Worlds is
                      more than a game; it&apos;s a community that shows up for
                      each other.
                    </p>
                  </div>

                  {/* Bottom Statement */}
                  <div className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 p-4 mt-6">
                    <p className="text-base font-bold text-white text-center">
                      Impact remains a core part of the Magic Worlds identity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Forward Outlook */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Forward Outlook
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Your future is brighter
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black dark:from-black dark:via-zinc-900 dark:to-zinc-800 border border-zinc-700/50 shadow-2xl">
            {/* Starfield Background Effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    backgroundColor:
                      Math.random() > 0.5 ? "#d2a64e" : "#40b0bf",
                    opacity: Math.random() * 0.8 + 0.2,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Side - Hero Content */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 mb-4 tracking-tight">
                      YOUR FUTURE IS BRIGHTER
                    </h3>
                    <p className="text-base text-zinc-300 leading-relaxed">
                      The weeks ahead are focused on deepening the player-owned
                      nature of the ecosystem.
                    </p>
                  </div>

                  {/* Futuristic Landscape Visual */}
                  <div className="relative mt-8 h-64 rounded-2xl overflow-hidden border border-cyan-500/30">
                    <Image
                      src="/Gemini_Generated_Image_p1jbyap1jbyap1jb.png"
                      alt="Futuristic digital landscape with floating islands"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Right Side - What Next Section */}
                <div className="space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-400/30 p-6 backdrop-blur-sm">
                    <h4 className="text-lg font-bold text-cyan-300 mb-6">
                      What Next?
                    </h4>
                    <ul className="space-y-4">
                      <li className="flex gap-3 items-start">
                        <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <p className="text-zinc-200 leading-relaxed text-base">
                          Turning Magic Worlds into a more measurable digital
                          economy, with clearer stats on player activity,
                          tokens, and economic flows.
                        </p>
                      </li>
                      <li className="flex gap-3 items-start">
                        <div
                          className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <p className="text-zinc-200 leading-relaxed text-base">
                          Strengthening governance structures so players feel
                          more agency in world decisions.
                        </p>
                      </li>
                      <li className="flex gap-3 items-start">
                        <div
                          className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                        <p className="text-zinc-200 leading-relaxed text-base">
                          Scaling the internship and volunteer network to bring
                          in fresh creators and engineers.
                        </p>
                      </li>
                      <li className="flex gap-3 items-start">
                        <div
                          className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                          style={{ animationDelay: "0.6s" }}
                        />
                        <p className="text-zinc-200 leading-relaxed text-base">
                          Expanding communication styles that work across
                          languages, cultures, and time zones.
                        </p>
                      </li>
                      <li className="flex gap-3 items-start">
                        <div
                          className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
                          style={{ animationDelay: "0.8s" }}
                        />
                        <p className="text-zinc-200 leading-relaxed text-base">
                          Enhancing bot-powered productivity so players can
                          simply live their lives and let AI increase usefulness
                          in the background.
                        </p>
                      </li>
                    </ul>
                  </div>

                  {/* Concluding Statement */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10 border border-blue-400/30 p-6 backdrop-blur-sm">
                    <p className="text-zinc-200 leading-relaxed text-base">
                      Magic Worlds is edging closer to the idea of a global,
                      community-driven digital region with cultural, economic,
                      and social value.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#40b0bf] p-6 md:p-12 shadow-2xl">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto">
              {/* Main Heading */}
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight uppercase">
                CONCLUSION
              </h2>

              {/* Sub-heading */}
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-8 tracking-tight uppercase">
                YOU ARE THE MAGIC
              </h3>

              {/* Body Paragraphs */}
              <div className="space-y-6 mb-8">
                <p className="text-base md:text-lg text-white leading-relaxed">
                  Magic Worlds is a player-governed sovereign digital economy,
                  not merely a game. We have architected an environment where
                  player-to-player interactions generate real, transferable
                  value, blurring the line between digital citizenship and
                  economic participation.
                </p>

                <p className="text-base md:text-lg text-white leading-relaxed">
                  The Magic Worlds model creates a self-reinforcing, sustainable
                  loop. Time invested in social activities (
                  <span className="text-yellow-400 font-semibold">Love</span>
                  ), content creation (
                  <span className="text-yellow-400 font-semibold">Laugh</span>
                  ), and skill development (
                  <span className="text-yellow-400 font-semibold">Learn</span>)
                  directly generates utility and scarce assets, which translates
                  into real-world economic value (
                  <span className="text-yellow-400 font-semibold">
                    Lucrative
                  </span>
                  ) via P2P markets.
                </p>
              </div>

              {/* Call to Action Button */}
              <div className="mb-8 flex justify-center">
                <a
                  href="https://www.themagicworlds.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span>Explore the Worlds</span>
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
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </a>
              </div>

              {/* Concluding Statement */}
              <p className="text-lg md:text-xl text-white leading-relaxed font-medium">
                Join the Magic, where your voice shapes the future, your
                creations earn real value, and together we build a thriving
                digital nation you truly own!
              </p>
            </div>
          </div>
        </section>
      </>
    </MainLayout>
  );
}
