"use client";

interface LikeButtonProps {
  count: number;
  liked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export default function LikeButton({ count, liked, disabled, onToggle }: LikeButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-3 rounded-full border px-5 py-3 text-sm font-semibold transition ${
        liked
          ? "border-transparent bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-xl shadow-fuchsia-500/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50"
      } ${disabled ? "cursor-not-allowed opacity-70" : "hover:-translate-y-0.5"}`}
    >
      <span className="text-base">❤️</span>
      <span>{count} Likes</span>
    </button>
  );
}
