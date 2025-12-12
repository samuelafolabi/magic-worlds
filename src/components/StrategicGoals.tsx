import React from "react";

interface StrategicGoalsProps {
  goals: string[];
}

export default function StrategicGoals({ goals }: StrategicGoalsProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Strategic Goals
      </h3>
      
      <div className="space-y-3">
        {goals.map((goal, index) => (
          <div
            key={index}
            className="group flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200"
          >
            {/* Checkbox Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded border-2 border-[#40b0bf] flex items-center justify-center group-hover:bg-[#40b0bf] transition-colors duration-200">
                <svg
                  className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            
            {/* Goal Text */}
            <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-[#40b0bf] dark:group-hover:text-[#40b0bf]/80 transition-colors duration-200">
              {goal}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
