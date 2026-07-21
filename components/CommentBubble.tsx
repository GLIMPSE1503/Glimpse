import { CommentRow } from "@/lib/supabase/types";

interface CommentBubbleProps {
  comment: CommentRow;
  isOwn: boolean;
  onDelete?: (id: string) => void;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const delta = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (delta < 60) return `${delta} sec${delta === 1 ? "" : "s"} ago`;
  const minutes = Math.floor(delta / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function CommentBubble({ comment, isOwn, onDelete }: CommentBubbleProps) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={comment.user_avatar_url || "/placeholder-avatar.png"}
            alt={comment.user_full_name ?? "User avatar"}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{comment.user_full_name || "Anonymous"}</p>
            <p className="text-xs text-slate-500">{timeAgo(comment.created_at)}</p>
          </div>
        </div>
        {isOwn && onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
          >
            Delete
          </button>
        ) : null}
      </div>

      <p className="mt-4 rounded-3xl bg-purple-50 p-4 text-sm leading-6 text-slate-700">{comment.content}</p>
    </div>
  );
}
