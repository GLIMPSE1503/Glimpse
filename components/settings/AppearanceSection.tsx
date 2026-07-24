"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

const OPTIONS: { key: "light" | "dark" | "system"; label: string; icon: string }[] = [
  { key: "light", label: "Light", icon: "☀️" },
  { key: "dark", label: "Dark", icon: "🌙" },
  { key: "system", label: "System", icon: "💻" },
];

export default function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
      <p className="mt-1 text-sm text-slate-500">Choose how Glimpse looks on this device.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setTheme(option.key)}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition ${
              theme === option.key
                ? "border-purple-400 bg-purple-50 text-purple-700"
                : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-2xl">{option.icon}</span>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}