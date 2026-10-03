import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar, Platform } from 'react-native';
import { Trophy, CheckCircle, Calendar, ArrowRight, Award, Flame, Users, Sparkles } from 'lucide-react-native';
import { theme } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { Challenge, ChallengeParticipant } from '@corro-por-amor/shared';

interface ChallengesScreenProps {
  challenges: Challenge[];
  participants: ChallengeParticipant[];
  onSelectChallenge: (challenge: Challenge) => void;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  challenges,
  participants,
  onSelectChallenge,
}) => {
  const [filter, setFilter] = useState<'my' | 'available' | 'completed'>('my');

  const myParticipantMap = new Map(participants.map(p => [p.challenge_id, p]));

  const myChallenges = challenges.filter(c => {
    const p = myParticipantMap.get(c.id);
    return p && p.completion_percentage < 100;
  });

  const completedChallenges = challenges.filter(c => {
    const p = myParticipantMap.get(c.id);
    return p && p.completion_percentage >= 100;
  });

  const availableChallenges = challenges.filter(c => {
    return !myParticipantMap.has(c.id) && c.status === 'active';
  });

  const currentList = 
    filter === 'my' ? myChallenges :
    filter === 'completed' ? completedChallenges : availableChallenges;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.palette.blue1} />

      {/* 1. Immersive Deep Navy Curved Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.decorCircleTopRight} />
        <View style={styles.decorCircleBottomLeft} />

        <View style={styles.tagPill}>
          <Sparkles size={11} color={theme.colors.palette.blue9} strokeWidth={2.4} />
          <Text style={styles.tagPillText}>CIRCUITO & MEDALHAS VIRTUAIS</Text>
        </View>

        <Text style={styles.heroTitle}>Desafios Virtuais</Text>
        <Text style={styles.heroSubtitle}>
          Supere distâncias, conquiste medalhas reais e registre seu nome no mural dos campeões.
        </Text>

        {/* Summary Metric Strip */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{myChallenges.length}</Text>
            <Text style={styles.summaryLabel}>Em Andamento</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{availableChallenges.length}</Text>
            <Text style={styles.summaryLabel}>Disponíveis</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedChallenges.length}</Text>
            <Text style={styles.summaryLabel}>Concluídos</Text>
          </View>
        </View>
      </View>

      {/* 2. Curved White Content Sheet */}
      <View style={styles.curvedContentSheet}>
        {/* Modern Filter Pills */}
        <View style={styles.filterPillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              onPress={() => setFilter('my')}
              style={[styles.filterPill, filter === 'my' && styles.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filter === 'my' && styles.filterPillTextActive]}>
                Em Andamento ({myChallenges.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter('available')}
              style={[styles.filterPill, filter === 'available' && styles.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filter === 'available' && styles.filterPillTextActive]}>
                Disponíveis ({availableChallenges.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter('completed')}
              style={[styles.filterPill, filter === 'completed' && styles.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterPillText, filter === 'completed' && styles.filterPillTextActive]}>
                Concluídos ({completedChallenges.length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Challenges List */}
        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
        {currentList.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Trophy size={36} color={theme.colors.brandBlue} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'my' ? 'Nenhum desafio em andamento' :
               filter === 'completed' ? 'Nenhuma medalha conquistada ainda' : 'Nenhum novo desafio aberto'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'my' 
                ? 'Inscreva-se em um dos desafios disponíveis para registrar suas corridas e ganhar medalhas.'
                : 'Complete 100% da meta de um desafio para desbloquear sua premiação oficial.'}
            </Text>
            {filter === 'my' && (
              <TouchableOpacity
                onPress={() => setFilter('available')}
                style={styles.emptyButton}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>EXPLORAR DESAFIOS</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          currentList.map((ch) => {
            const p = myParticipantMap.get(ch.id);
            const isCompleted = p && p.completion_percentage >= 100;
            const completedKm = p ? p.completed_km : 0;
            const percentage = p ? p.completion_percentage : 0;

            return (
              <TouchableOpacity
                key={ch.id}
                onPress={() => onSelectChallenge(ch)}
                style={styles.challengeCard}
                activeOpacity={0.88}
              >
                {ch.image_url ? (
                  <Image
                    source={{ uri: ch.image_url }}
                    style={styles.cardImageBanner}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Top Badge Row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText} numberOfLines={1}>
                      {p?.target_km 
                        ? `${p.target_km} KM` 
                        : (ch.distance_options && ch.distance_options.length > 0 
                            ? (ch.distance_options.length > 3
                                ? `${ch.distance_options[0]}k - ${ch.distance_options[ch.distance_options.length - 1]}k (${ch.distance_options.length} metas)`
                                : ch.distance_options.map(k => `${k}k`).join(' • '))
                            : `${ch.target_km} KM`)}
                    </Text>
                  </View>

                  <View style={styles.topRightBadges}>
                    {ch.has_medal && (
                      <View style={styles.medalPill}>
                        <Award size={13} color="#D97706" strokeWidth={2.4} />
                        <Text style={styles.medalPillText}>Medalha</Text>
                      </View>
                    )}
                    <View style={styles.xpPill}>
                      <Flame size={13} color="#C2410C" strokeWidth={2.4} />
                      <Text style={styles.xpPillText}>+{ch.xp_join} XP</Text>
                    </View>
                  </View>
                </View>

                {/* Challenge Title & Description */}
                <Text style={styles.cardTitle}>{ch.name}</Text>
                {ch.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {ch.description}
                  </Text>
                ) : null}

                {/* Progress / Target Section */}
                {p ? (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressKmText}>
                        {completedKm.toFixed(1)} <Text style={styles.progressTargetText}>/ {p.target_km || ch.target_km} km</Text>
                      </Text>
                      <Text style={styles.progressPercentText}>
                        {Math.round(percentage)}%
                      </Text>
                    </View>
                    <ProgressBar percentage={percentage} height={8} />
                  </View>
                ) : null}

                {/* Card Footer with Date & Action Button */}
                <View style={styles.cardFooter}>
                  <View style={styles.calendarRow}>
                    <Calendar size={13} color={theme.colors.textSecondary} />
                    <Text style={styles.calendarText}>
                      Até {new Date(ch.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.actionPillButton}>
                    <Text style={styles.actionPillText}>
                      {isCompleted ? 'VER RESULTADO' : p ? 'CONTINUAR' : 'PARTICIPAR'}
                    </Text>
                    <ArrowRight size={13} color={theme.colors.white} strokeWidth={2.5} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(1, 42, 74, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(137, 194, 217, 0.2)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.white,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.palette.blue9,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(137, 194, 217, 0.2)',
  },

  // 2. Curved Content Sheet
  curvedContentSheet: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingTop: 14,
  },
  filterPillsContainer: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.card,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 135, // Clears floating dock
    gap: 16,
  },
  challengeCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 18,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
  },
  cardImageBanner: {
    width: '100%',
    height: 140,
    borderRadius: theme.radius.lg,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  topRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  medalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  xpPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  progressContainer: {
    gap: 6,
    paddingVertical: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressKmText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  progressTargetText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brandBlue,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  actionPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
  emptyState: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 30,
    alignItems: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    marginTop: 6,
  },
  emptyButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
