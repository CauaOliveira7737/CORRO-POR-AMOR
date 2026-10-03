import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw, Check } from 'lucide-react-native';
import { theme } from './src/theme';
import { supabase } from './src/api/supabase';
import { offlineStorage, PendingActivity } from './src/services/offlineStorage';
import { notificationService } from './src/services/notificationService';
import { BottomNavBar, MobileTab } from './src/components/BottomNavBar';
import { AnimatedSplashScreen } from './src/components/AnimatedSplashScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { ActiveRunScreen } from './src/screens/ActiveRunScreen';
import { RunResultScreen } from './src/screens/RunResultScreen';
import { ActivityHistoryScreen } from './src/screens/ActivityHistoryScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useRunTracker } from './src/hooks/useRunTracker';
import { 
  Profile, 
  Challenge, 
  ChallengeParticipant, 
  Activity, 
  Achievement, 
  AthleteAchievement,
  validateRunPhysicalLimits,
  RunPoint
} from '@corro-por-amor/shared';
import { photoStorage } from './src/services/photoStorage';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<MobileTab>('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<AthleteAchievement[]>([]);
  
  // Offline & Sync States
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [lastFinishedRun, setLastFinishedRun] = useState<{
    activityId?: string | null;
    distanceKm: number;
    movingSeconds: number;
    pausedSeconds: number;
    averagePace: string;
    xpEarned: number;
    isFlagged: boolean;
    isOffline?: boolean;
    routeCoordinates?: RunPoint[];
  } | null>(null);

  const tracker = useRunTracker();

  // Auto-sync function
  const triggerSync = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const res = await offlineStorage.syncPendingActivities(supabase);
      if (res.syncedCount > 0) {
        setSyncBanner(`✓ ${res.syncedCount} treino(s) offline sincronizado(s) com sucesso!`);
        setTimeout(() => setSyncBanner(null), 4000);
        if (profile?.id) {
          await loadData(profile.id);
        }
      }
      const remaining = await offlineStorage.getPendingActivities();
      setPendingSyncCount(remaining.length);
    } catch (err) {
      console.warn('Auto-sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load Supabase or Cached Data
  const loadData = async (userId?: string) => {
    try {
      setLoading(true);

      const net = await NetInfo.fetch();
      const online = Boolean(net.isConnected && net.isInternetReachable !== false);
      setIsOffline(!online);

      if (!online) {
        // Offline: Read from local cache
        const cached = await offlineStorage.getCachedAppData();
        if (cached.challenges.length > 0) setChallenges(cached.challenges);
        if (cached.achievements.length > 0) setAchievements(cached.achievements);
        if (cached.participants.length > 0) setParticipants(cached.participants);
        if (cached.profile) setProfile(cached.profile);

        const pending = await offlineStorage.getPendingActivities();
        setPendingSyncCount(pending.length);
        setActivities([...pending as any, ...cached.activities]);
        setUserAchievements(cached.userAchievements);
        return;
      }

      // 1. Fetch Challenges
      const { data: chData } = await supabase
        .from('challenges')
        .select('*')
        .order('start_date', { ascending: false });
      if (chData) setChallenges(chData);

      // 2. Fetch Achievements
      const { data: achData } = await supabase
        .from('achievements')
        .select('*');
      if (achData) setAchievements(achData);

      // 3. Fetch Participants (with joined profiles and challenges)
      const { data: partData } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          athlete:profiles(*),
          challenge:challenges(*)
        `)
        .order('completed_km', { ascending: false });
      if (partData) setParticipants(partData);

      // 4. Fetch User Profile & Activities if logged in
      const effectiveUserId = userId || session?.user?.id;
      let freshProfile: Profile | null = null;
      let freshActivities: Activity[] = [];
      let freshUserAch: AthleteAchievement[] = [];

      if (effectiveUserId) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', effectiveUserId)
          .single();
        if (profData) {
          freshProfile = profData;
          setProfile(profData);
        }

        const { data: actData } = await supabase
          .from('activities')
          .select(`
            *,
            challenge:challenges(*)
          `)
          .eq('athlete_id', effectiveUserId)
          .order('created_at', { ascending: false });
        if (actData) {
          freshActivities = actData;
          const pending = await offlineStorage.getPendingActivities();
          setPendingSyncCount(pending.length);
          setActivities([...pending as any, ...actData]);
        }

        const { data: userAchData } = await supabase
          .from('athlete_achievements')
          .select('*, achievement:achievements(*)')
          .eq('athlete_id', effectiveUserId);
        if (userAchData) {
          freshUserAch = userAchData;
          setUserAchievements(userAchData);
        }

        // Cache fresh data for offline use
        await offlineStorage.cacheAppData({
          profile: freshProfile,
          challenges: chData || undefined,
          participants: partData || undefined,
          activities: freshActivities,
          achievements: achData || undefined,
          userAchievements: freshUserAch,
        });

        // Sync local notifications (morning reminder + remaining km in challenge)
        const myActivePart = partData?.find((p) => p.athlete_id === effectiveUserId && p.completion_percentage < 100) || null;
        const myActChallenge = chData?.find((c) => c.id === myActivePart?.challenge_id) || null;
        notificationService.syncReminders(myActChallenge, myActivePart).catch(() => {});
      } else {
        setProfile(null);
        setActivities([]);
        setUserAchievements([]);
      }
    } catch (err) {
      console.warn('Error loading app data, using cache:', err);
      const cached = await offlineStorage.getCachedAppData();
      if (cached.challenges.length > 0) setChallenges(cached.challenges);
      if (cached.achievements.length > 0) setAchievements(cached.achievements);
      if (cached.participants.length > 0) setParticipants(cached.participants);
      if (cached.profile) setProfile(cached.profile);
      const pending = await offlineStorage.getPendingActivities();
      setPendingSyncCount(pending.length);
      setActivities([...pending as any, ...cached.activities]);
      setUserAchievements(cached.userAchievements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial network check
    NetInfo.fetch().then((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    // 2. Network listener for auto-sync
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
      if (!offline) {
        triggerSync();
      }
    });

    // 3. Auth session listener
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user?.id) {
        loadData(currentSession.user.id);
      } else {
        // Check if there is cached profile for offline startup
        const cached = await offlineStorage.getCachedAppData();
        if (cached.profile) {
          setProfile(cached.profile);
          setChallenges(cached.challenges);
          setParticipants(cached.participants);
          setActivities(cached.activities);
        }
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        loadData(newSession.user.id);
      } else {
        setProfile(null);
        setActivities([]);
        setUserAchievements([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeNet();
      subscription.unsubscribe();
    };
  }, []);

  // Determine Active Challenge
  const activeChallenge = challenges.find((c) => c.status === 'active') || challenges[0] || null;
  const myParticipantRecord = participants.find(
    (p) => p.challenge_id === activeChallenge?.id && p.athlete_id === profile?.id
  ) || null;

  const lastActivity = activities.length > 0 ? activities[0] : null;

  // Calculate Ranking Position
  const activeChallengeParticipants = participants.filter((p) => p.challenge_id === activeChallenge?.id);
  const myRankIndex = activeChallengeParticipants.findIndex((p) => p.athlete_id === profile?.id);
  const myRankingPosition = myRankIndex >= 0 ? myRankIndex + 1 : (participants.length > 0 ? participants.length + 1 : 1);

  // Start Run Handler
  const handleStartRun = () => {
    tracker.startTracking();
  };

  // Submit Finished Run
  const handleRunFinished = async () => {
    const distance = tracker.distanceKm;
    const movingSecs = tracker.movingSeconds;
    const pausedSecs = tracker.pausedSeconds;
    const pace = tracker.averagePace;

    // Validate physical limits (Anti-cheat)
    const validation = validateRunPhysicalLimits(distance, movingSecs, tracker.routePoints);
    const xpBase = activeChallenge ? activeChallenge.xp_activity : 10;
    const routePayload = tracker.routePoints.length > 0 ? {
      type: 'LineString',
      coordinates: tracker.routePoints.map((p) => [p.longitude, p.latitude]),
      points: tracker.routePoints,
    } : null;

    let savedLocally = false;

    // Save to Supabase or Offline Queue
    if (profile?.id) {
      if (isOffline) {
        // Offline: save to pending queue
        const offlineAct: PendingActivity = {
          id: 'offline-' + Date.now(),
          athlete_id: profile.id,
          challenge_id: activeChallenge ? activeChallenge.id : null,
          distance_km: distance,
          moving_seconds: movingSecs,
          paused_seconds: pausedSecs,
          average_pace: pace,
          source: 'gps',
          status: validation.status,
          rejection_reason: validation.reason || null,
          xp_earned: xpBase,
          route_geojson: routePayload,
          created_at: new Date().toISOString(),
        };
        await offlineStorage.savePendingActivity(offlineAct);
        setPendingSyncCount((prev) => prev + 1);
        savedLocally = true;

        // Immediately update local profile and activities so athlete sees them
        setProfile((prev) => prev ? {
          ...prev,
          total_distance_km: (prev.total_distance_km || 0) + distance,
          xp_total: (prev.xp_total || 0) + xpBase,
        } : null);

        setActivities((prev) => [offlineAct as any, ...prev]);

        if (myParticipantRecord) {
          setParticipants((prev) => prev.map((p) => {
            if (p.id === myParticipantRecord.id) {
              const newKm = p.completed_km + distance;
              const target = p.target_km || 50;
              return {
                ...p,
                completed_km: newKm,
                completion_percentage: Math.min(100, (newKm / target) * 100),
              };
            }
            return p;
          }));
        }
      } else {
        let createdActivityId: string | null = null;
        try {
          const { data: insertedAct, error } = await supabase.from('activities').insert([
            {
              athlete_id: profile.id,
              challenge_id: activeChallenge ? activeChallenge.id : null,
              distance_km: distance,
              moving_seconds: movingSecs,
              paused_seconds: pausedSecs,
              average_pace: pace,
              source: 'gps',
              status: validation.status,
              rejection_reason: validation.reason || null,
              xp_earned: xpBase,
              route_geojson: routePayload,
            },
          ]).select('id').single();

          if (error) throw error;
          if (insertedAct?.id) {
            createdActivityId = insertedAct.id;
          }
          await loadData(profile.id);
        } catch (err) {
          console.warn('Network error saving activity, saving to offline queue:', err);
          const offlineAct: PendingActivity = {
            id: 'offline-' + Date.now(),
            athlete_id: profile.id,
            challenge_id: activeChallenge ? activeChallenge.id : null,
            distance_km: distance,
            moving_seconds: movingSecs,
            paused_seconds: pausedSecs,
            average_pace: pace,
            source: 'gps',
            status: validation.status,
            rejection_reason: validation.reason || null,
            xp_earned: xpBase,
            route_geojson: routePayload,
            created_at: new Date().toISOString(),
          };
          createdActivityId = offlineAct.id;
          await offlineStorage.savePendingActivity(offlineAct);
          setPendingSyncCount((prev) => prev + 1);
          savedLocally = true;

          setProfile((prev) => prev ? {
            ...prev,
            total_distance_km: (prev.total_distance_km || 0) + distance,
            xp_total: (prev.xp_total || 0) + xpBase,
          } : null);

          setActivities((prev) => [offlineAct as any, ...prev]);
        }

        setLastFinishedRun({
          activityId: createdActivityId,
          distanceKm: distance,
          movingSeconds: movingSecs,
          pausedSeconds: pausedSecs,
          averagePace: pace,
          xpEarned: xpBase,
          isFlagged: !validation.isApproved,
          isOffline: savedLocally,
          routeCoordinates: tracker.routePoints,
        });
      }
    }
  };

  // Save Photo to Activity Handler
  const handleSaveActivityPhoto = async (activityId: string | null, photoUri: string) => {
    if (!activityId || !profile?.id) return;
    try {
      if (activityId.startsWith('offline-')) {
        await offlineStorage.updatePendingActivityPhoto(activityId, photoUri);
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? { ...a, photo_url: photoUri } : a))
        );
        return;
      }

      const uploadedUrl = await photoStorage.uploadActivityPhoto(profile.id, photoUri);
      const { error } = await supabase
        .from('activities')
        .update({ photo_url: uploadedUrl })
        .eq('id', activityId);

      if (error) throw error;

      setActivities((prev) =>
        prev.map((a) => (a.id === activityId ? { ...a, photo_url: uploadedUrl } : a))
      );
    } catch (err) {
      console.error('Error saving activity photo:', err);
      throw err;
    }
  };

  // Delete Activity Handler
  const handleDeleteActivity = async (activityId: string) => {
    try {
      if (activityId.startsWith('offline-')) {
        await offlineStorage.removePendingActivity(activityId);
        setActivities((prev) => prev.filter((a) => a.id !== activityId));
        setPendingSyncCount((prev) => Math.max(0, prev - 1));
        return;
      }
      const { error } = await supabase.from('activities').delete().eq('id', activityId);
      if (error) throw error;
      if (profile?.id) {
        await loadData(profile.id);
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
      throw err;
    }
  };

  // Update Profile Handler
  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!profile?.id) return;
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (error) throw error;
      await loadData(profile.id);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const userId = profile.id;

      // 1. Delete user's achievements
      await supabase.from('athlete_achievements').delete().eq('athlete_id', userId);

      // 2. Delete user's activities
      await supabase.from('activities').delete().eq('athlete_id', userId);

      // 3. Delete user's challenge participants
      await supabase.from('challenge_participants').delete().eq('athlete_id', userId);

      // 4. Delete user's profile row
      await supabase.from('profiles').delete().eq('id', userId);

      // 5. Clear offline cache and cancel local notifications
      await offlineStorage.clearAll();
      await notificationService.cancelAll();

      // 6. Sign out from Supabase Auth
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setActivities([]);
      setUserAchievements([]);
      Alert.alert('Conta Excluída', 'Sua conta e todos os dados associados foram excluídos com sucesso.');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      Alert.alert('Erro ao excluir conta', err.message || 'Não foi possível excluir sua conta no momento.');
    } finally {
      setLoading(false);
    }
  };

  // Join Challenge Handler
  const handleJoinChallenge = async (ch: Challenge, chosenTargetKm?: number) => {
    if (profile?.id) {
      const target = chosenTargetKm || (ch.distance_options && ch.distance_options[0]) || ch.target_km || 50;
      try {
        await supabase.from('challenge_participants').insert([
          {
            challenge_id: ch.id,
            athlete_id: profile.id,
            target_km: target,
            completed_km: 0,
            completion_percentage: 0,
          },
        ]);
        await loadData(profile.id);
      } catch (err) {
        console.error('Error joining challenge:', err);
      }
    }
    setSelectedChallenge(null);
  };

  // Auth Gating: If not logged in and not loading (and no cached offline profile), show AuthScreen
  if (!session && !profile && !loading) {
    return (
      <AnimatedSplashScreen isReady={!loading}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
          <AuthScreen 
            onAuthSuccess={async () => {
              const { data } = await supabase.auth.getSession();
              if (data.session) {
                setSession(data.session);
                loadData(data.session.user.id);
              }
            }} 
          />
        </SafeAreaView>
      </AnimatedSplashScreen>
    );
  }

  // Initial Loading: Branded Animated Splash holds the screen seamlessly
  if (loading && !session && !profile) {
    return (
      <AnimatedSplashScreen isReady={false}>
        <View style={[styles.safeArea, { backgroundColor: theme.colors.palette.blue1 }]} />
      </AnimatedSplashScreen>
    );
  }

  // If Run is Active or Paused -> Show Active Run Screen
  if (tracker.status === 'running' || tracker.status === 'paused') {
    return (
      <ActiveRunScreen
        tracker={tracker}
        activeChallenge={activeChallenge}
        onFinishConfirmed={handleRunFinished}
      />
    );
  }

  // If Run Result Modal is Active -> Show Run Result Screen
  if (lastFinishedRun) {
    return (
      <RunResultScreen
        distanceKm={lastFinishedRun.distanceKm}
        movingSeconds={lastFinishedRun.movingSeconds}
        pausedSeconds={lastFinishedRun.pausedSeconds}
        averagePace={lastFinishedRun.averagePace}
        challenge={activeChallenge}
        participant={myParticipantRecord}
        xpEarned={lastFinishedRun.xpEarned}
        isFlaggedForReview={lastFinishedRun.isFlagged}
        isOfflineSaved={lastFinishedRun.isOffline}
        routeCoordinates={lastFinishedRun.routeCoordinates}
        onSavePhoto={(photoUri) => handleSaveActivityPhoto(lastFinishedRun.activityId || null, photoUri)}
        onContinue={() => {
          tracker.resetRun();
          setLastFinishedRun(null);
          setCurrentTab('home');
        }}
      />
    );
  }

  // If Challenge Detail is Open
  if (selectedChallenge) {
    const selParticipant = participants.find(
      (p) => p.challenge_id === selectedChallenge.id && p.athlete_id === profile?.id
    ) || null;
    const selRankIndex = participants
      .filter((p) => p.challenge_id === selectedChallenge.id)
      .findIndex((p) => p.athlete_id === profile?.id);

    return (
      <ChallengeDetailScreen
        challenge={selectedChallenge}
        participant={selParticipant}
        rankingPosition={selRankIndex >= 0 ? selRankIndex + 1 : 0}
        participantsCount={participants.filter((p) => p.challenge_id === selectedChallenge.id).length}
        onBack={() => setSelectedChallenge(null)}
        onStartRun={() => {
          setSelectedChallenge(null);
          handleStartRun();
        }}
        onViewRanking={() => {
          setSelectedChallenge(null);
          setCurrentTab('ranking');
        }}
        onJoinChallenge={(chosenTargetKm) => handleJoinChallenge(selectedChallenge, chosenTargetKm)}
      />
    );
  }

  return (
    <AnimatedSplashScreen isReady={!loading}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

        {/* Connection & Sync Status Banner */}
        {syncBanner ? (
          <View style={styles.syncBannerSuccess}>
            <Check size={14} color="#059669" strokeWidth={2.5} />
            <Text style={styles.syncBannerText}>{syncBanner}</Text>
          </View>
        ) : isOffline ? (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color="#C2410C" strokeWidth={2.4} />
            <Text style={styles.offlineBannerText}>
              Modo Offline{pendingSyncCount > 0 ? ` • ${pendingSyncCount} corrida(s) salva(s) no celular` : ' • GPS ativo'}
            </Text>
          </View>
        ) : pendingSyncCount > 0 ? (
          <TouchableOpacity onPress={triggerSync} style={styles.syncingBanner} activeOpacity={0.8}>
            <RefreshCw size={13} color="#0284C7" strokeWidth={2.2} />
            <Text style={styles.syncingBannerText}>
              {isSyncing ? 'Sincronizando com o servidor...' : `${pendingSyncCount} corrida(s) no celular • Toque para enviar`}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Main Tab Screen View */}
        <View style={styles.mainContent}>
          {currentTab === 'home' && (
            <HomeScreen
              profile={profile}
              activeChallenge={activeChallenge}
              participantRecord={myParticipantRecord}
              lastActivity={lastActivity}
              activities={activities}
              rankingPosition={myRankingPosition}
              onStartRun={handleStartRun}
              onViewChallengeDetails={(ch) => setSelectedChallenge(ch)}
              onViewRanking={() => setCurrentTab('ranking')}
            />
          )}

          {currentTab === 'challenges' && (
            <ChallengesScreen
              challenges={challenges}
              participants={participants}
              onSelectChallenge={(ch) => setSelectedChallenge(ch)}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityHistoryScreen
              activities={activities}
              onDeleteActivity={handleDeleteActivity}
              onSavePhoto={(actId, photoUri) => handleSaveActivityPhoto(actId, photoUri)}
            />
          )}

          {currentTab === 'ranking' && (
            <RankingScreen
              participants={participants}
              currentProfile={profile}
              challenges={challenges}
              selectedChallengeId={activeChallenge?.id}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              achievements={achievements}
              userAchievements={userAchievements}
              participants={participants}
              activeChallenge={activeChallenge}
              onSignOut={() => supabase.auth.signOut()}
              onDeleteAccount={handleDeleteAccount}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </View>

        {/* Bottom Navigation with 5 tabs and outline icons */}
        <BottomNavBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />
      </SafeAreaView>
    </AnimatedSplashScreen>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  syncingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  syncingBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  syncBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  syncBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});
