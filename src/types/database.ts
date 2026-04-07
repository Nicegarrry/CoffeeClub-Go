export interface DbUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  preferred_method: string;
  created_at: string;
}

export interface DbMachine {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  type: 'espresso' | 'filter' | 'both';
  burr_size: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface DbGrinder {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  burr_type: 'flat' | 'conical' | 'blade';
  notes: string;
  is_active: boolean;
  created_at: string;
}

export interface DbBean {
  id: string;
  user_id: string;
  name: string;
  roaster: string;
  origin: string;
  process: 'washed' | 'natural' | 'honey';
  roast_level: 'light' | 'light-med' | 'medium' | 'medium-dark' | 'dark';
  tasting_notes: string[];
  stock_grams: number;
  color: string;
  is_active: boolean;
  purchase_date: string | null;
  roast_date: string | null;
  created_at: string;
}

export interface DbBrew {
  id: string;
  user_id: string;
  bean_id: string | null;
  machine_id: string | null;
  grinder_id: string | null;
  name: string;
  brew_type: 'espresso' | 'latte' | 'flat white' | 'filter' | 'pour over' | 'cold brew' | 'other';
  rating: number;
  dose_in_grams: number | null;
  yield_out_grams: number | null;
  brew_time_seconds: number | null;
  grind_setting: string | null;
  tasting_notes: string[];
  photo_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface DbFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DbLike {
  user_id: string;
  brew_id: string;
  created_at: string;
}

export interface DbEquipmentCatalog {
  id: string;
  type: 'grinder' | 'espresso_machine' | 'pour_over' | 'immersion' | 'kettle' | 'scale' | 'accessory';
  brand: string;
  model: string;
  detail: string;
  grind_range: string | null;
  popularity_rank: number;
  created_at: string;
}

export interface DbComment {
  id: string;
  user_id: string;
  brew_id: string;
  body: string;
  created_at: string;
}

export interface CommentWithUser extends DbComment {
  user: Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface DbStory {
  id: string;
  user_id: string;
  photo_url: string | null;
  caption: string;
  type: 'brew' | 'checkin' | 'bean' | 'general';
  brew_id: string | null;
  bean_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryWithUser extends DbStory {
  user: Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  actor_id: string;
  brew_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationWithActor extends DbNotification {
  actor: Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface DbBookmark {
  user_id: string;
  brew_id: string;
  created_at: string;
}

export interface DbCafe {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  website: string;
  hours_json: Record<string, string>;
  description: string;
  cover_photo_url: string | null;
  claimed_by_user_id: string | null;
  created_at: string;
}

export interface CafeWithStats extends DbCafe {
  avg_rating: number;
  review_count: number;
  checkin_count: number;
}

export interface DbCafeReview {
  id: string;
  user_id: string;
  cafe_id: string;
  rating: number;
  body: string;
  tags: string[];
  created_at: string;
}

export interface CafeReviewWithUser extends DbCafeReview {
  user: Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface DbCheckin {
  id: string;
  user_id: string;
  cafe_id: string;
  brew_id: string | null;
  created_at: string;
}

// Joined types for common queries
export interface BrewWithUser extends DbBrew {
  user: Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface BrewWithDetails extends DbBrew {
  user: Pick<DbUser, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  bean: Pick<DbBean, 'id' | 'name' | 'roaster' | 'color'> | null;
  machine: Pick<DbMachine, 'id' | 'name'> | null;
  grinder: Pick<DbGrinder, 'id' | 'name'> | null;
  like_count: number;
  is_liked: boolean;
}

export interface UserProfile extends DbUser {
  brew_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}
