import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';
import { Profile, Challenge, ChallengeParticipant, Activity, Achievement, AthleteAchievement } from '@corro-por-amor/shared';

const KEYS = {
  PROFILE: '@cpa_cached_profile',
  CHALLENGES: '@cpa_cached_challenges',
  PARTICIPANTS: '@cpa_cached_participants',
  ACTIVITIES: '@cpa_cached_activities',
  ACHIEVEMENTS: '@cpa_cached_achievements',
  USER_ACHIEVEMENTS: '@cpa_cached_user_achievements',
  PENDING_ACTIVITIES: '@cpa_pending_activities',
};

export interface PendingActivity {
  id: string; // client UUID
  athlete_id: string;
  challenge_id: string | null;
  distance_km: number;
  moving_seconds: number;
  paused_seconds: number;
  average_pace: string;
  source: 'gps' | 'strava';
  status: 'approved' | 'pending_review' | 'rejected';
  rejection_reason: string | null;
  xp_earned: number;
  photo_url?: string | null;
  route_geojson?: any;
  created_at: string;
}

export const offlineStorage = {
  // 1. Cache App Data for offline browsing
  async cacheAppData(data: {
    profile?: Profile | null;
    challenges?: Challenge[];
    participants?: ChallengeParticipant[];
    activities?: Activity[];
    achievements?: Achievement[];
    userAchievements?: AthleteAchievement[];
  }): Promise<void> {
    try {
      const operations: [string, string][] = [];

      if (data.profile !== undefined) {
        operations.push([KEYS.PROFILE, JSON.stringify(data.profile)]);
      }
      if (data.challenges !== undefined) {
        operations.push([KEYS.CHALLENGES, JSON.stringify(data.challenges)]);
      }
      if (data.participants !== undefined) {
        operations.push([KEYS.PARTICIPANTS, JSON.stringify(data.participants)]);
      }
      if (data.activities !== undefined) {
        operations.push([KEYS.ACTIVITIES, JSON.stringify(data.activities)]);
      }
      if (data.achievements !== undefined) {
        operations.push([KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements)]);
      }
      if (data.userAchievements !== undefined) {
        operations.push([KEYS.USER_ACHIEVEMENTS, JSON.stringify(data.userAchievements)]);
      }

      if (operations.length > 0) {
        await AsyncStorage.multiSet(operations);
      }
    } catch (err) {
      console.warn('offlineStorage.cacheAppData error:', err);
    }
  },

  // 2. Retrieve Cached App Data when offline
  async getCachedAppData(): Promise<{
    profile: Profile | null;
    challenges: Challenge[];
    participants: ChallengeParticipant[];
    activities: Activity[];
    achievements: Achievement[];
    userAchievements: AthleteAchievement[];
  }> {
    try {
      const results = await AsyncStorage.multiGet([
        KEYS.PROFILE,
        KEYS.CHALLENGES,
        KEYS.PARTICIPANTS,
        KEYS.ACTIVITIES,
        KEYS.ACHIEVEMENTS,
        KEYS.USER_ACHIEVEMENTS,
      ]);

      const map = new Map(results);

      return {
        profile: map.get(KEYS.PROFILE) ? JSON.parse(map.get(KEYS.PROFILE)!) : null,
        challenges: map.get(KEYS.CHALLENGES) ? JSON.parse(map.get(KEYS.CHALLENGES)!) : [],
        participants: map.get(KEYS.PARTICIPANTS) ? JSON.parse(map.get(KEYS.PARTICIPANTS)!) : [],
        activities: map.get(KEYS.ACTIVITIES) ? JSON.parse(map.get(KEYS.ACTIVITIES)!) : [],
        achievements: map.get(KEYS.ACHIEVEMENTS) ? JSON.parse(map.get(KEYS.ACHIEVEMENTS)!) : [],
        userAchievements: map.get(KEYS.USER_ACHIEVEMENTS) ? JSON.parse(map.get(KEYS.USER_ACHIEVEMENTS)!) : [],
      };
    } catch (err) {
      console.warn('offlineStorage.getCachedAppData error:', err);
      return {
        profile: null,
        challenges: [],
        participants: [],
        activities: [],
        achievements: [],
        userAchievements: [],
      };
    }
  },

  // 3. Queue a completed activity recorded offline
  async savePendingActivity(activity: PendingActivity): Promise<void> {
    try {
      const existing = await this.getPendingActivities();
      const updated = [activity, ...existing];
      await AsyncStorage.setItem(KEYS.PENDING_ACTIVITIES, JSON.stringify(updated));
    } catch (err) {
      console.warn('offlineStorage.savePendingActivity error:', err);
    }
  },

  // 4. Retrieve pending activities
  async getPendingActivities(): Promise<PendingActivity[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.PENDING_ACTIVITIES);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('offlineStorage.getPendingActivities error:', err);
      return [];
    }
  },

  // 5. Remove synced activity from queue
  async removePendingActivity(id: string): Promise<void> {
    try {
      const existing = await this.getPendingActivities();
      const filtered = existing.filter((item) => item.id !== id);
      await AsyncStorage.setItem(KEYS.PENDING_ACTIVITIES, JSON.stringify(filtered));
    } catch (err) {
      console.warn('offlineStorage.removePendingActivity error:', err);
    }
  },

  // 6. Update photo for an existing pending activity
  async updatePendingActivityPhoto(id: string, photoUrl: string): Promise<void> {
    try {
      const existing = await this.getPendingActivities();
      const updated = existing.map((act) => act.id === id ? { ...act, photo_url: photoUrl } : act);
      await AsyncStorage.setItem(KEYS.PENDING_ACTIVITIES, JSON.stringify(updated));
    } catch (err) {
      console.warn('offlineStorage.updatePendingActivityPhoto error:', err);
    }
  },

  // 7. Synchronize all pending activities with Supabase
  async syncPendingActivities(supabase: SupabaseClient): Promise<{
    syncedCount: number;
    errors: any[];
  }> {
    const pending = await this.getPendingActivities();
    if (pending.length === 0) {
      return { syncedCount: 0, errors: [] };
    }

    let syncedCount = 0;
    const errors: any[] = [];

    for (const act of pending) {
      try {
        const { error } = await supabase.from('activities').insert([
          {
            athlete_id: act.athlete_id,
            challenge_id: act.challenge_id,
            distance_km: act.distance_km,
            moving_seconds: act.moving_seconds,
            paused_seconds: act.paused_seconds,
            average_pace: act.average_pace,
            source: act.source,
            status: act.status,
            rejection_reason: act.rejection_reason,
            xp_earned: act.xp_earned,
            photo_url: act.photo_url || null,
            route_geojson: act.route_geojson || null,
            created_at: act.created_at,
          },
        ]);

        if (error) {
          console.error('Error syncing activity:', act.id, error);
          errors.push(error);
        } else {
          await this.removePendingActivity(act.id);
          syncedCount++;
        }
      } catch (err) {
        console.error('Sync network exception:', err);
        errors.push(err);
      }
    }

    return { syncedCount, errors };
  },

  /**
   * Clears all cached offline data
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (err) {
      console.warn('Error clearing offline storage:', err);
    }
  },
};
