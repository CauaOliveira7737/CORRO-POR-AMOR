export type UserRole = 'athlete' | 'organizer' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  total_distance_km: number;
  xp_total: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export type ChallengeStatus = 'draft' | 'active' | 'ended';

export interface Challenge {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string;
  target_km: number;
  distance_options?: number[];
  min_km_per_activity: number;
  xp_join: number;
  xp_activity: number;
  xp_completion: number;
  xp_first_place: number;
  has_medal: boolean;
  has_certificate: boolean;
  status: ChallengeStatus;
  created_at: string;
  // Computed / aggregated
  participants_count?: number;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  athlete_id: string;
  joined_at: string;
  target_km?: number;
  completed_km: number;
  completion_percentage: number;
  completed_at: string | null;
  is_first_to_finish: boolean;
  // Joined relations
  athlete?: Profile;
  challenge?: Challenge;
}

export type ActivitySource = 'gps' | 'strava';
export type ActivityStatus = 'approved' | 'pending_review' | 'rejected';

export interface RunPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number | null; // in m/s
  accuracy?: number | null;
  timestamp: number;
}

export interface Activity {
  id: string;
  athlete_id: string;
  challenge_id: string | null;
  distance_km: number;
  moving_seconds: number;
  paused_seconds: number;
  average_pace: string;
  route_geojson: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude]
    points?: RunPoint[];
  } | null;
  source: ActivitySource;
  status: ActivityStatus;
  rejection_reason?: string | null;
  xp_earned: number;
  photo_url?: string | null;
  strava_activity_id?: string | null;
  created_at: string;
  // Joined
  athlete?: Profile;
  challenge?: Challenge;
}

export interface AthleteIntegration {
  id: string;
  athlete_id: string;
  provider: 'strava';
  provider_athlete_id: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  athlete_name?: string | null;
  athlete_avatar?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  xp_reward: number;
}

export interface AthleteAchievement {
  id: string;
  athlete_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export type MedalStatus = 'pendente' | 'enviado' | 'entregue';

export interface Medal {
  id: string;
  challenge_id: string;
  athlete_id: string;
  status: MedalStatus;
  tracking_code: string | null;
  updated_at: string;
  athlete?: Profile;
  challenge?: Challenge;
}

export interface Certificate {
  id: string;
  challenge_id: string;
  athlete_id: string;
  completed_at: string;
  certificate_code: string;
  athlete?: Profile;
  challenge?: Challenge;
}

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';
export type PauseReason = 'manual' | 'auto';
