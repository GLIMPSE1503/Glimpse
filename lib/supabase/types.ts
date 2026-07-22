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
  created_at: string;
  updated_at: string;
};

export type SupabaseUser = {
  id: string;
  email: string | null;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
};
