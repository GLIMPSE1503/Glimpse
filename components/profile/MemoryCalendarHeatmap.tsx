"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

type Props = {
  uploadDates: string[]; // ISO date strings, one per glimpse created_at
};

const DAYS_TO_SHOW = 371; // ~53 weeks, GitHub-style
const CELL_SIZE = 12;
const CELL_GAP = 3;

function getIntensityClass(count: number) {
  if (count === 0) return "bg-slate-100";
  if (count === 1) return "bg-purple-200";
  if (count === 2) return "bg-purple-400";
  if (count >= 3) return "bg-purple-600";
  return "bg-slate-100";
}

export default function MemoryCalendarHeatmap({ uploadDates }: Props) {
  const { weeks, totalInRange } = useMemo(() => {
    const countByDate = new Map<string, number>();
    uploadDates.forEach((iso) => {
      const key = new Date(iso).toISOString().slice(0, 10);
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (DAYS_TO_SHOW - 1));
    // Align to the most recent Sunday on or before startDate, so weeks are complete columns
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days: { date: Date; count: number }[] = [];
    const cursor = new Date(startDate);
    let total = 0;

    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      const count = countByDate.get(key) ?? 0;
      total += count;
      days.push({ date: new Date(cursor), count });
      cursor.setDate(cursor.getDate() + 1);
    }

    const weekColumns: { date: Date; count: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weekColumns.push(days.slice(i, i + 7));
    }

    return { weeks: weekColumns, totalInRange: total };
  }, [uploadDates]);

  return (
    <div className="rounded-3xl border border-white/90 bg-white/90 p-5 shadow-md shadow-slate-200/40 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Upload Activity</p>
        <p className="text-xs text-slate-400">{totalInRange} memories in the last year</p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" style={{ width: weeks.length * (CELL_SIZE + CELL_GAP) }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(weekIndex * 0.004, 0.6) }}
                  title={`${day.date.toDateString()}: ${day.count} ${day.count === 1 ? "memory" : "memories"}`}
                  className={`rounded-sm ${getIntensityClass(day.count)}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-slate-400">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-slate-100" />
        <span className="h-3 w-3 rounded-sm bg-purple-200" />
        <span className="h-3 w-3 rounded-sm bg-purple-400" />
        <span className="h-3 w-3 rounded-sm bg-purple-600" />
        <span>More</span>
      </div>
    </div>
  );
}