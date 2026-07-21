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
      className={`inline-flex items-center gap-2 rounded-3xl px-4 py-2 text-sm font-semibold transition ${
        liked
          ? "bg-pink-500 text-white hover:bg-pink-600"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
    >
      <span>❤️</span>
      <span>{count} Likes</span>
    </button>
  );
}
