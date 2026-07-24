export type GlimpseRow = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;

  expires_at: string;
  is_archived: boolean;
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

export type LikeRow = {
  id: string;
  glimpse_id: string;
  user_id: string;
  created_at: string;
};

export type CommentRow = {
  id: string;
  glimpse_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_full_name?: string | null;
  user_avatar_url?: string | null;
};
export type ProfileRow = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
};
export type FollowRow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  sender_id: string;
  glimpse_id: string | null;
  type: "like" | "comment" | "follow";
  message: string;
  is_read: boolean;
  created_at: string;

  sender_name?: string | null;
  sender_avatar?: string | null;
};
export type FollowerRow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
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

export type GlimpseStatsRow = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
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
export type SupabaseUser = {
  id: string;
  email: string | null;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
};
