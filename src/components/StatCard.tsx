import React from "react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  trend?: string;
  icon?: React.ReactNode;
}

export default function StatCard({
  label,
  value,
  description,
  trend,
  icon,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#40b0bf]/5 via-[#d2a64e]/5 to-[#04d27f]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              {label}
            </p>
            {trend && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <svg
                  className="w-3 h-3"
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
                {trend}
              </span>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#40b0bf] via-[#d2a64e] to-[#04d27f] flex items-center justify-center text-white shadow-lg shadow-[#40b0bf]/30">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <h3 className="text-4xl font-bold bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] bg-clip-text text-transparent">
            {value}
          </h3>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Bottom Accent Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}
