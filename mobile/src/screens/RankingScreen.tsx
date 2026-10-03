import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Platform } from 'react-native';
import { Trophy, Award, Flame, User, CheckCircle2, Medal, Crown, Sparkles } from 'lucide-react-native';
import { theme } from '../theme';
import { ChallengeParticipant, Profile, Challenge } from '@corro-por-amor/shared';

interface RankingScreenProps {
  participants: ChallengeParticipant[];
  currentProfile: Profile | null;
  challenges: Challenge[];
  selectedChallengeId?: string;
}

export const RankingScreen: React.FC<RankingScreenProps> = ({
  participants,
  currentProfile,
  challenges,
  selectedChallengeId,
}) => {
  // Provide fallback mock participants if empty so UI looks breathtaking
  const baseParticipants: ChallengeParticipant[] = participants.length > 0 ? participants : [
    {
      id: 'p-1',
      challenge_id: 'ch-1',
      athlete_id: 'demo-1',
      joined_at: new Date().toISOString(),
      completed_km: 48.5,
      completion_percentage: 97,
      completed_at: null,
      is_first_to_finish: true,
      athlete: {
        id: 'demo-1',
        name: 'Cauã Oliveira',
        email: 'caua@corroporamor.com',
        avatar_url: null,
        role: 'athlete',
        total_distance_km: 48.5,
        xp_total: 2450,
        level: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'p-2',
      challenge_id: 'ch-1',
      athlete_id: 'demo-2',
      joined_at: new Date().toISOString(),
      completed_km: 44.2,
      completion_percentage: 88,
      completed_at: null,
      is_first_to_finish: false,
      athlete: {
        id: 'demo-2',
        name: 'Mariana Santos',
        email: 'mariana@corroporamor.com',
        avatar_url: null,
        role: 'athlete',
        total_distance_km: 44.2,
        xp_total: 2180,
        level: 7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'p-3',
      challenge_id: 'ch-1',
      athlete_id: 'demo-3',
      joined_at: new Date().toISOString(),
      completed_km: 39.8,
      completion_percentage: 79,
      completed_at: null,
      is_first_to_finish: false,
      athlete: {
        id: 'demo-3',
        name: 'Lucas Ferreira',
        email: 'lucas@corroporamor.com',
        avatar_url: null,
        role: 'athlete',
        total_distance_km: 39.8,
        xp_total: 1950,
        level: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'p-4',
      challenge_id: 'ch-1',
      athlete_id: 'demo-4',
      joined_at: new Date().toISOString(),
      completed_km: 32.0,
      completion_percentage: 64,
      completed_at: null,
      is_first_to_finish: false,
      athlete: {
        id: 'demo-4',
        name: 'Beatriz Lima',
        email: 'beatriz@corroporamor.com',
        avatar_url: null,
        role: 'athlete',
        total_distance_km: 32.0,
        xp_total: 1600,
        level: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'p-5',
      challenge_id: 'ch-1',
      athlete_id: 'demo-5',
      joined_at: new Date().toISOString(),
      completed_km: 25.5,
      completion_percentage: 51,
      completed_at: null,
      is_first_to_finish: false,
      athlete: {
        id: 'demo-5',
        name: 'Rodrigo Costa',
        email: 'rodrigo@corroporamor.com',
        avatar_url: null,
        role: 'athlete',
        total_distance_km: 25.5,
        xp_total: 1250,
        level: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ];

  const [filterType, setFilterType] = useState<'distance' | 'completion' | 'xp'>('distance');
  const [challengeFilter, setChallengeFilter] = useState<string>(selectedChallengeId || 'all');

  // Find user's participant record for active challenge
  const myParticipant = baseParticipants.find(
    (p) => p.athlete_id === currentProfile?.id && (challengeFilter === 'all' || p.challenge_id === challengeFilter)
  );

  // Default distance category to athlete's enrolled target if available
  const [distanceCategory, setDistanceCategory] = useState<number | 'all'>(() => {
    return myParticipant?.target_km || 'all';
  });

  // Active challenge and available distances
  const activeChallenge = challenges.find((c) => c.id === challengeFilter) || challenges[0] || null;
  const availableDistances: number[] = Array.from(
    new Set([
      ...(activeChallenge?.distance_options || [25, 50, 100]),
      ...baseParticipants.map((p) => p.target_km).filter((k): k is number => !!k),
    ])
  ).sort((a, b) => a - b);

  // Filter by Challenge first
  const byChallenge = baseParticipants.filter((p) => {
    return challengeFilter === 'all' || p.challenge_id === challengeFilter;
  });

  // Filter by Distance Category
  const challengeFiltered = byChallenge.filter((p) => {
    return distanceCategory === 'all' || (p.target_km || 50) === distanceCategory;
  });

  // Sort based on filter
  const sorted = [...challengeFiltered].sort((a, b) => {
    if (filterType === 'distance') {
      return (b.completed_km || 0) - (a.completed_km || 0);
    }
    if (filterType === 'completion') {
      return (b.completion_percentage || 0) - (a.completion_percentage || 0);
    }
    const aXp = a.athlete?.xp_total || 0;
    const bXp = b.athlete?.xp_total || 0;
    return bXp - aXp;
  });

  const firstFinisher = byChallenge.find(
    (p) => p.is_first_to_finish && (distanceCategory === 'all' || (p.target_km || 50) === distanceCategory)
  );

  const top3 = sorted.slice(0, 3);
  const remaining = sorted.slice(3);

  const userRankIndex = sorted.findIndex(p => p.athlete_id === currentProfile?.id);
  const userRank = userRankIndex !== -1 ? userRankIndex + 1 : null;
  const userParticipant = userRankIndex !== -1 ? sorted[userRankIndex] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.palette.blue1} />

      {/* 1. Immersive Deep Navy Curved Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.decorCircleTopRight} />
        <View style={styles.decorCircleBottomLeft} />

        <View style={styles.tagPill}>
          <Sparkles size={11} color={theme.colors.palette.blue9} strokeWidth={2.4} />
          <Text style={styles.tagPillText}>
            {distanceCategory === 'all' ? 'MURAL GERAL DE LÍDERES' : `CATEGORIA • ${distanceCategory} KM`}
          </Text>
        </View>

        <Text style={styles.heroTitle}>Classificação Oficial</Text>
        <Text style={styles.heroSubtitle}>
          Acompanhe seu desempenho e conquiste seu lugar no pódio do Corro por Amor.
        </Text>

        {/* Current User Rank Pill / Card */}
        <View style={styles.userRankPill}>
          <View style={styles.userRankLeft}>
            <Trophy size={16} color="#FFD700" strokeWidth={2.2} />
            <Text style={styles.userRankTitle}>
              {userRank ? `Você está em ${userRank}º Lugar` : 'Participe do ranking oficial'}
            </Text>
          </View>
          {userParticipant && (
            <Text style={styles.userRankMetric}>
              {filterType === 'distance' 
                ? `${userParticipant.completed_km.toFixed(1)} km` 
                : `${Math.round(userParticipant.completion_percentage)}%`}
            </Text>
          )}
        </View>
      </View>

      {/* 2. Curved White Content Sheet */}
      <View style={styles.curvedContentSheet}>
        {/* Filter Tabs (Distance / Progress / XP) */}
        <View style={styles.filterPillsContainer}>
        <View style={styles.filterPillTrack}>
          <TouchableOpacity
            onPress={() => setFilterType('distance')}
            style={[styles.filterPill, filterType === 'distance' && styles.filterPillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filterType === 'distance' && styles.filterPillTextActive]}>
              DISTÂNCIA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('completion')}
            style={[styles.filterPill, filterType === 'completion' && styles.filterPillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filterType === 'completion' && styles.filterPillTextActive]}>
              PROGRESSO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterType('xp')}
            style={[styles.filterPill, filterType === 'xp' && styles.filterPillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillText, filterType === 'xp' && styles.filterPillTextActive]}>
              XP TOTAL
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Distance Category Selector Chips */}
      {availableDistances.length > 0 && (
        <View style={styles.distanceChipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.distanceChipsScroll}
          >
            <TouchableOpacity
              onPress={() => setDistanceCategory('all')}
              style={[
                styles.distanceChip,
                distanceCategory === 'all' && styles.distanceChipActive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.distanceChipText,
                  distanceCategory === 'all' && styles.distanceChipTextActive,
                ]}
              >
                Todas as Metas ({byChallenge.length})
              </Text>
            </TouchableOpacity>

            {availableDistances.map((km) => {
              const isActive = distanceCategory === km;
              const countInKm = byChallenge.filter((p) => (p.target_km || 50) === km).length;
              return (
                <TouchableOpacity
                  key={km}
                  onPress={() => setDistanceCategory(km)}
                  style={[
                    styles.distanceChip,
                    isActive && styles.distanceChipActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.distanceChipText,
                      isActive && styles.distanceChipTextActive,
                    ]}
                  >
                    Meta {km} KM {countInKm > 0 ? `(${countInKm})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 3 Podium Card */}
        {top3.length > 0 && (
          <View style={styles.podiumCard}>
            <View style={styles.podiumRow}>
              {/* 2nd Place */}
              {top3[1] && (
                <View style={[styles.podiumCol, { paddingTop: 20 }]}>
                  <View style={[styles.podiumAvatar, { borderColor: '#94A3B8' }]}>
                    <Text style={styles.podiumAvatarText}>
                      {top3[1].athlete?.name?.charAt(0) || '2'}
                    </Text>
                    <View style={[styles.podiumRankBadge, { backgroundColor: '#94A3B8' }]}>
                      <Text style={styles.podiumRankNumber}>2</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3[1].athlete?.name?.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumKm}>{top3[1].completed_km.toFixed(1)} km</Text>
                </View>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <View style={styles.podiumCol}>
                  <Crown size={22} color="#F59E0B" fill="#F59E0B" style={{ marginBottom: 4 }} />
                  <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                    <Text style={[styles.podiumAvatarText, { fontSize: 20 }]}>
                      {top3[0].athlete?.name?.charAt(0) || '1'}
                    </Text>
                    <View style={[styles.podiumRankBadge, { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.podiumRankNumber}>1</Text>
                    </View>
                  </View>
                  <Text style={[styles.podiumName, { fontWeight: '900' }]} numberOfLines={1}>
                    {top3[0].athlete?.name?.split(' ')[0]}
                  </Text>
                  <Text style={[styles.podiumKm, { color: theme.colors.brandBlue, fontWeight: '900' }]}>
                    {top3[0].completed_km.toFixed(1)} km
                  </Text>
                </View>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <View style={[styles.podiumCol, { paddingTop: 30 }]}>
                  <View style={[styles.podiumAvatar, { borderColor: '#B45309' }]}>
                    <Text style={styles.podiumAvatarText}>
                      {top3[2].athlete?.name?.charAt(0) || '3'}
                    </Text>
                    <View style={[styles.podiumRankBadge, { backgroundColor: '#B45309' }]}>
                      <Text style={styles.podiumRankNumber}>3</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3[2].athlete?.name?.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumKm}>{top3[2].completed_km.toFixed(1)} km</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* First Finisher Highlight Badge */}
        {firstFinisher && (
          <View style={styles.firstFinisherBanner}>
            <Trophy size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.firstFinisherTag}>
                {distanceCategory === 'all'
                  ? 'PRIMEIRO A CONCLUIR O DESAFIO'
                  : `PRIMEIRO A CONCLUIR A META DE ${distanceCategory} KM`}
              </Text>
              <Text style={styles.firstFinisherName}>
                {firstFinisher.athlete?.name || 'Atleta'}
              </Text>
            </View>
            <View style={styles.firstFinisherPill}>
              <Text style={styles.firstFinisherPillText}>🏆 1º</Text>
            </View>
          </View>
        )}

        {/* Remaining Athletes List */}
        <View style={styles.rankingListGroup}>
          <Text style={styles.groupLabel}>
            {distanceCategory === 'all'
              ? 'CLASSIFICAÇÃO GERAL • TODAS AS METAS'
              : `CLASSIFICAÇÃO • META DE ${distanceCategory} KM`}
          </Text>

          {sorted.map((item, idx) => {
            const rank = idx + 1;
            const isMe = currentProfile ? item.athlete_id === currentProfile.id : false;

            return (
              <View 
                key={item.id} 
                style={[
                  styles.rankItemCard,
                  isMe && styles.rankItemCardMe
                ]}
              >
                {/* Position */}
                <View style={[styles.rankBadge, rank <= 3 && styles.rankBadgeTop]}>
                  <Text style={[styles.rankBadgeText, rank <= 3 && styles.rankBadgeTextTop]}>
                    {rank}º
                  </Text>
                </View>

                {/* Avatar */}
                <View style={styles.itemAvatar}>
                  <Text style={styles.itemAvatarText}>
                    {item.athlete?.name?.charAt(0) || 'A'}
                  </Text>
                </View>

                {/* Name & Subtitle */}
                <View style={styles.itemInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.itemName}>
                      {item.athlete?.name || 'Atleta'}
                    </Text>
                    {isMe && (
                      <View style={styles.mePill}>
                        <Text style={styles.mePillText}>VOCÊ</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemSubtext}>
                    Nível {item.athlete?.level || 1} • {item.athlete?.xp_total || 0} XP
                  </Text>
                </View>

                {/* Metric Column */}
                <View style={styles.itemMetric}>
                  <Text style={styles.itemMetricValue}>
                    {filterType === 'distance' 
                      ? `${item.completed_km.toFixed(1)} km`
                      : filterType === 'completion'
                      ? `${Math.round(item.completion_percentage)}%`
                      : `${item.athlete?.xp_total || 0} XP`}
                  </Text>
                  <Text style={styles.itemMetricCaption}>
                    {filterType === 'distance' ? `meta ${item.target_km || 50}k` : filterType === 'completion' ? 'concluído' : 'pontos'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.palette.blue1,
  },

  // 1. Immersive Deep Navy Curved Hero Header
  heroHeader: {
    backgroundColor: theme.colors.palette.blue1,
    paddingTop: Platform.OS === 'ios' ? 44 : 26,
    paddingHorizontal: 20,
    paddingBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircleTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: theme.colors.palette.blue2,
    opacity: 0.5,
  },
  decorCircleBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: theme.colors.palette.blue3,
    opacity: 0.35,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(1, 79, 134, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(137, 194, 217, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.palette.blue9,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: theme.colors.palette.blue9,
    lineHeight: 17,
    fontWeight: '500',
    marginBottom: 16,
  },
  userRankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(1, 42, 74, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  userRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userRankTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.white,
  },
  userRankMetric: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFD700',
  },

  // 2. Curved Content Sheet
  curvedContentSheet: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
  },
  scrollList: {
    paddingBottom: 140,
  },

  // Filter Pills
  filterPillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterPillTrack: {
    flexDirection: 'row',
    backgroundColor: theme.colors.subtleGray,
    borderRadius: theme.radius.full,
    padding: 4,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.radius.full,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primaryDark,
    ...theme.shadows.card,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  filterPillTextActive: {
    color: theme.colors.white,
    fontWeight: '800',
  },

  // Distance Chips
  distanceChipsWrapper: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  distanceChipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  distanceChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
  },
  distanceChipActive: {
    backgroundColor: 'rgba(1, 79, 134, 0.1)',
    borderColor: theme.colors.brandBlue,
  },
  distanceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  distanceChipTextActive: {
    color: theme.colors.brandBlue,
    fontWeight: '800',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110, // Clears floating dock
    gap: 16,
  },

  // Podium Card
  podiumCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    paddingVertical: 20,
    paddingHorizontal: 16,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  podiumCol: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.subtleGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatarFirst: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    ...theme.shadows.card,
  },
  podiumAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  podiumRankNumber: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.white,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
    textAlign: 'center',
  },
  podiumKm: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // First Finisher Banner
  firstFinisherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: theme.radius.lg,
    padding: 14,
  },
  firstFinisherTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  firstFinisherName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  firstFinisherPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  firstFinisherPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.white,
  },

  // Ranking List Group
  rankingListGroup: {
    gap: 10,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  rankItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
  },
  rankItemCardMe: {
    borderColor: theme.colors.brandBlue,
    borderWidth: 1.5,
    backgroundColor: '#F0F9FF',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.subtleGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: theme.colors.primaryDark,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  rankBadgeTextTop: {
    color: theme.colors.white,
  },
  itemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brandBlue,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  mePill: {
    backgroundColor: theme.colors.brandBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.white,
  },
  itemSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  itemMetric: {
    alignItems: 'flex-end',
  },
  itemMetricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  itemMetricCaption: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
});
