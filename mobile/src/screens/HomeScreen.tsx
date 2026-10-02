import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { 
  Play, 
  Flame, 
  Award, 
  ChevronRight, 
  Clock, 
  MapPin, 
  BarChart2, 
  Zap, 
  TrendingUp,
  Calendar,
  Sparkles,
  Trophy
} from 'lucide-react-native';
import { theme } from '../theme';
import { CircularProgressRing } from '../components/CircularProgressRing';
import { Profile, Challenge, ChallengeParticipant, Activity } from '@corro-por-amor/shared';

interface HomeScreenProps {
  profile: Profile | null;
  activeChallenge: Challenge | null;
  participantRecord: ChallengeParticipant | null;
  lastActivity: Activity | null;
  activities?: Activity[];
  rankingPosition: number;
  onStartRun: () => void;
  onViewChallengeDetails: (challenge: Challenge) => void;
  onViewRanking: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  activeChallenge,
  participantRecord,
  lastActivity,
  activities = [],
  rankingPosition,
  onStartRun,
  onViewChallengeDetails,
  onViewRanking,
}) => {
  const athleteName = profile?.name ? profile.name.split(' ')[0] : 'Atleta';
  const totalDistance = profile?.total_distance_km || 0;
  const totalXp = profile?.xp_total || 0;
  const estimatedCalories = Math.round(totalDistance * 65);

  const targetKm = participantRecord?.target_km || activeChallenge?.target_km || 0;
  const completedKm = participantRecord?.completed_km || 0;
  const percentage = participantRecord?.completion_percentage || 0;
  const remainingKm = Math.max(0, targetKm - completedKm);

  // Generate current real week days (Sunday to Saturday) with real run detection
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon...
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - currentDayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const weekDays = dayLabels.map((label, idx) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + idx);
    const dateNum = dayDate.getDate();
    const isToday = dayDate.toDateString() === now.toDateString();

    // Check if user has real activity on this day
    const dayActivities = activities.filter((act) => {
      const actDate = new Date(act.created_at);
      return actDate.toDateString() === dayDate.toDateString();
    });

    const hasRun = dayActivities.length > 0;
    const dayKm = dayActivities.reduce((sum, act) => sum + (act.distance_km || 0), 0);

    return {
      day: label,
      date: dateNum,
      active: isToday,
      hasRun,
      dayKm,
    };
  });

  const thisWeekRunsCount = weekDays.filter((d) => d.hasRun).length;
  const thisWeekTotalKm = weekDays.reduce((sum, d) => sum + d.dayKm, 0);

  // Sparkline heights for current week
  const maxDayKm = Math.max(1, ...weekDays.map((d) => d.dayKm));
  const sparklineBars = weekDays.map((d) => {
    if (d.dayKm <= 0) return 8; // subtle base height
    return Math.max(20, Math.round((d.dayKm / maxDayKm) * 100));
  });

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Top Greeting Header with Brand Logo */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.brandHeaderBadge}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.brandHeaderLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.greetingTitle}>Olá, {athleteName} 👋</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.xpBadge}>
            <Flame size={15} color={theme.colors.accentEnergy} strokeWidth={2.4} />
            <Text style={styles.xpText}>{totalXp} XP</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{athleteName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* 2. Horizontal Weekly Activity Strip with REAL dates and runs */}
      <View style={styles.weekStripContainer}>
        <View style={styles.weekHeader}>
          <Text style={styles.sectionTitle}>SEMANA DE TREINOS</Text>
          <Text style={styles.weekSubtitle}>
            {thisWeekRunsCount === 0 
              ? 'Nenhum treino nesta semana' 
              : `${thisWeekRunsCount} treino${thisWeekRunsCount > 1 ? 's' : ''} concluído${thisWeekRunsCount > 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.daysRow}>
          {weekDays.map((item, idx) => (
            <View 
              key={idx} 
              style={[
                styles.dayPill,
                item.active && styles.dayPillActive
              ]}
            >
              <Text style={[styles.dayLabel, item.active && styles.dayLabelActive]}>
                {item.day}
              </Text>
              <Text style={[styles.dayNumber, item.active && styles.dayNumberActive]}>
                {item.date}
              </Text>
              {item.hasRun && (
                <View style={[styles.runDot, item.active && styles.runDotActive]} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 3. Hero Challenge Progress Card (Reference Circular Workout Progress) */}
      {activeChallenge ? (
        <View style={styles.challengeHeroCard}>
          <View style={styles.challengeCardLeft}>
            <View style={styles.challengeTagRow}>
              <View style={styles.activeTag}>
                <View style={styles.activeDotPulse} />
                <Text style={styles.activeTagText}>DESAFIO ATIVO</Text>
              </View>
            </View>

            <Text style={styles.challengeHeroTitle} numberOfLines={2}>
              {activeChallenge.name}
            </Text>

            <View style={styles.distanceMetricBox}>
              <Text style={styles.distanceValue}>
                {completedKm.toFixed(1)} <Text style={styles.distanceTarget}>/ {targetKm} km</Text>
              </Text>
              <Text style={styles.remainingSubtitle}>
                {percentage >= 100 
                  ? '✓ Meta atingida com sucesso!' 
                  : `Faltam ${remainingKm.toFixed(1)} km para concluir`}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => onViewChallengeDetails(activeChallenge)}
              style={styles.detailsPillButton}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsPillText}>Ver Detalhes</Text>
              <ChevronRight size={14} color={theme.colors.brandBlue} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View style={styles.challengeCardRight}>
            <CircularProgressRing
              percentage={percentage}
              size={105}
              strokeWidth={10}
              color={theme.colors.brandBlue}
              backgroundColor="#E2E8F0"
              centerText={`${Math.round(percentage)}%`}
              subText="META"
            />
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Trophy size={36} color={theme.colors.brandBlue} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>Nenhum desafio em andamento</Text>
          <Text style={styles.emptySubtitle}>
            Participe de um desafio oficial para registrar quilômetros e conquistar medalhas!
          </Text>
        </View>
      )}

      {/* 4. Giant Hero Button: INICIAR CORRIDA (Reference Screen 6 & 7 "Start Now") */}
      <TouchableOpacity
        onPress={onStartRun}
        style={styles.giantCtaButton}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel="Iniciar Corrida"
      >
        <View style={styles.giantCtaInner}>
          <View style={styles.playIconCircle}>
            <Play size={20} color={theme.colors.primaryDark} fill={theme.colors.primaryDark} />
          </View>
          <View style={styles.ctaTextContainer}>
            <Text style={styles.giantCtaTitle}>INICIAR CORRIDA</Text>
            <Text style={styles.giantCtaSubtitle}>GPS Ativo • Detecção Automática</Text>
          </View>
          <ChevronRight size={20} color={theme.colors.white} strokeWidth={2.4} />
        </View>
      </TouchableOpacity>

      {/* 5. Health & Runner Metrics Overview (Reference "Health Overview") */}
      <View style={styles.metricsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MÉTRICAS DO ATLETA</Text>
          <Text style={styles.sectionAction}>Acumulado</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Card 1: Distance */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <MapPin size={18} color="#0284C7" strokeWidth={2.2} />
            </View>
            <Text style={styles.metricBigNumber}>
              {totalDistance.toFixed(1)}
              <Text style={styles.metricUnit}> km</Text>
            </Text>
            <Text style={styles.metricLabel}>Distância Total</Text>
          </View>

          {/* Card 2: Calories */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: theme.colors.accentEnergyLight }]}>
              <Flame size={18} color={theme.colors.accentEnergy} strokeWidth={2.2} />
            </View>
            <Text style={styles.metricBigNumber}>
              {estimatedCalories}
              <Text style={styles.metricUnit}> kcal</Text>
            </Text>
            <Text style={styles.metricLabel}>Calorias Queimadas</Text>
          </View>

          {/* Card 3: Pace / Time */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Zap size={18} color="#16A34A" strokeWidth={2.2} />
            </View>
            <Text style={styles.metricBigNumber}>
              {lastActivity ? lastActivity.average_pace : '--:--'}
              <Text style={styles.metricUnit}> /km</Text>
            </Text>
            <Text style={styles.metricLabel}>Ritmo Médio</Text>
          </View>
        </View>
      </View>

      {/* 6. Dark Insight / Workout Stats Card (Real weekly data) */}
      <View style={styles.darkInsightCard}>
        <View style={styles.darkInsightHeader}>
          <View style={styles.darkInsightTitleRow}>
            <TrendingUp size={18} color="#38BDF8" strokeWidth={2.4} />
            <Text style={styles.darkInsightTitle}>Evolução Semanal</Text>
          </View>
          <View style={styles.darkInsightBadge}>
            <Text style={styles.darkInsightBadgeText}>{thisWeekTotalKm.toFixed(1)} km</Text>
          </View>
        </View>

        <Text style={styles.darkInsightBody}>
          {thisWeekRunsCount > 0
            ? `Excelente consistência! Você completou ${thisWeekRunsCount} corrida${thisWeekRunsCount > 1 ? 's' : ''} e somou ${thisWeekTotalKm.toFixed(1)} km nesta semana.`
            : 'Nenhuma corrida registrada nesta semana. Inicie sua atividade hoje e turbine seu progresso!'}
        </Text>

        {/* Real 7-day sparkline bar visualizer */}
        <View style={styles.barsRow}>
          {sparklineBars.map((h, i) => (
            <View key={i} style={styles.barColumn}>
              <View 
                style={[
                  styles.barFill, 
                  { height: `${h}%` }, 
                  weekDays[i].hasRun && styles.barHighlight
                ]} 
              />
              <Text style={[styles.barLabel, weekDays[i].active && { color: '#38BDF8', fontWeight: '700' }]}>
                {weekDays[i].day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 7. Quick Summary: Last Run & Ranking */}
      <View style={styles.splitRow}>
        {/* Last Activity Card */}
        <View style={styles.splitCard}>
          <View style={styles.splitHeader}>
            <Text style={styles.splitLabel}>ÚLTIMO TREINO</Text>
            <Clock size={14} color={theme.colors.textSecondary} />
          </View>
          {lastActivity ? (
            <View style={styles.splitBody}>
              <Text style={styles.splitMainValue}>{lastActivity.distance_km.toFixed(1)} km</Text>
              <Text style={styles.splitSubValue}>
                {Math.floor(lastActivity.moving_seconds / 60)} min • {lastActivity.average_pace}
              </Text>
            </View>
          ) : (
            <View style={styles.splitBody}>
              <Text style={[styles.splitMainValue, { fontSize: 16, color: theme.colors.textMuted }]}>
                Sem treinos
              </Text>
              <Text style={styles.splitSubValue}>Inicie sua 1ª corrida!</Text>
            </View>
          )}
        </View>

        {/* Ranking Position Card */}
        <TouchableOpacity 
          onPress={onViewRanking}
          style={styles.splitCard}
          activeOpacity={0.8}
        >
          <View style={styles.splitHeader}>
            <Text style={styles.splitLabel}>SEU RANKING</Text>
            <BarChart2 size={14} color={theme.colors.brandBlue} />
          </View>
          <View style={styles.splitBody}>
            <Text style={styles.splitMainValue}>
              {rankingPosition > 0 ? `${rankingPosition}º` : '--'}
            </Text>
            <Text style={styles.splitSubValue}>
              {rankingPosition > 0 ? 'no ranking geral' : 'Participe do ranking'}
            </Text>
            <Text style={styles.splitLink}>Ver classificação →</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110, // Generous padding to clear the floating pill dock
    gap: 20,
  },

  // 1. Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  headerLeft: {
    gap: 3,
  },
  brandHeaderBadge: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  brandHeaderLogo: {
    width: 105,
    height: 28,
  },
  greetingSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...theme.shadows.card,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },

  // 2. Week Strip
  weekStripContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 16,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  weekSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brandBlue,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: theme.colors.subtleGray,
    minWidth: 42,
  },
  dayPillActive: {
    backgroundColor: theme.colors.primaryDark,
    ...theme.shadows.card,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dayLabelActive: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  dayNumberActive: {
    color: theme.colors.white,
  },
  runDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.brandBlue,
    marginTop: 5,
  },
  runDotActive: {
    backgroundColor: '#38BDF8',
  },

  // 3. Challenge Hero Card
  challengeHeroCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  challengeCardLeft: {
    flex: 1,
    paddingRight: 14,
  },
  challengeTagRow: {
    marginBottom: 8,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  activeDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  challengeHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    lineHeight: 22,
    marginBottom: 8,
  },
  distanceMetricBox: {
    marginBottom: 12,
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  distanceTarget: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  remainingSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  detailsPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  detailsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brandBlue,
  },
  challengeCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // 4. Giant Hero Button
  giantCtaButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.xl,
    paddingVertical: 18,
    paddingHorizontal: 20,
    ...theme.shadows.floating,
  },
  giantCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ctaTextContainer: {
    flex: 1,
  },
  giantCtaTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: 0.6,
  },
  giantCtaSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },

  // 5. Metrics Grid
  metricsSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brandBlue,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricBigNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.3,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // 6. Dark Insight Card
  darkInsightCard: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: theme.radius.xl,
    padding: 20,
    ...theme.shadows.floating,
  },
  darkInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  darkInsightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  darkInsightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.white,
  },
  darkInsightBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  darkInsightBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  darkInsightBody: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 16,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 54,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  barColumn: {
    alignItems: 'center',
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barFill: {
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  barHighlight: {
    backgroundColor: '#38BDF8',
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // 7. Split Cards
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: 16,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  splitBody: {
    gap: 2,
  },
  splitMainValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  splitSubValue: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  splitLink: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.brandBlue,
    marginTop: 6,
  },
});
