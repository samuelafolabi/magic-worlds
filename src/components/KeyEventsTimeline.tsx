import React from "react";

interface KeyEventsTimelineProps {
  events: string[];
}

export default function KeyEventsTimeline({ events }: KeyEventsTimelineProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg">
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        Key Events
      </h3>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4 items-start group">
            {/* Timeline Dot */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 shadow-lg shadow-purple-500/30 group-hover:scale-125 transition-transform duration-300" />
            </div>
            
            {/* Event Content */}
            <div className="flex-1 pb-4 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 -ml-[7px]">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                {event}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
