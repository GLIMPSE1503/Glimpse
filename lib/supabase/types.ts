export type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_private: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  auto_archive_enabled: boolean;
  language: string;
  created_at: string;
  updated_at: string;
};

export type ProfileStatsRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
};

export type GlimpseRow = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  is_pinned: boolean;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type GlimpseStatsRow = GlimpseRow & {
  like_count: number;
  comment_count: number;
};

export type CommentRow = {
  id: string;
  glimpse_id: string;
  user_id: string;
  user_full_name: string | null;
  user_avatar_url: string | null;
  content: string;
  created_at: string;
};

export type FollowerRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type FollowStatus = "none" | "following" | "requested";

export type FollowRequestRow = {
  id: string;
  requester_id: string;
  target_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  requester_name?: string | null;
  requester_avatar?: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  sender_id: string;
  glimpse_id: string | null;
  type: "like" | "comment" | "follow" | "follow_request" | "follow_accepted" | "request_accepted";
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string | null;
  sender_avatar?: string | null;
};

export type CollectionRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type CollectionItemRow = {
  id: string;
  collection_id: string;
  glimpse_id: string;
  created_at: string;
};

export type CollectionStatsRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emoji: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  cover_image_url: string | null;
  item_count: number;
};

export type MemoryStatsRow = {
  user_id: string;
  total_memories: number;
  archived_memories: number;
  collections_count: number;
  likes_received: number;
  comments_received: number;
};

export type BlockedUserRow = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_name?: string | null;
  blocked_avatar?: string | null;
};

export type StoryRow = {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
};

export type StoryGroup = {
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  stories: StoryRow[];
};