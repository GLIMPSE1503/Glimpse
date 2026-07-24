export type GlimpseRow = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
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

export type SupabaseUser = {
  id: string;
  email: string | null;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
};
