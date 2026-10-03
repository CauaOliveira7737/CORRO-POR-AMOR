import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, BarChart2, Award, Calendar, Users, Target, ShieldCheck, Flame, CheckCircle2, Check } from 'lucide-react-native';
import { theme } from '../theme';
import { CircularProgressRing } from '../components/CircularProgressRing';
import { ProgressBar } from '../components/ProgressBar';
import { Challenge, ChallengeParticipant } from '@corro-por-amor/shared';

interface ChallengeDetailScreenProps {
  challenge: Challenge;
  participant: ChallengeParticipant | null;
  rankingPosition: number;
  participantsCount: number;
  onBack: () => void;
  onStartRun: () => void;
  onViewRanking: () => void;
  onJoinChallenge: (chosenTargetKm: number) => void;
}

export const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({
  challenge,
  participant,
  rankingPosition,
  participantsCount,
  onBack,
  onStartRun,
  onViewRanking,
  onJoinChallenge,
}) => {
  const availableDistances = challenge.distance_options && challenge.distance_options.length > 0 
    ? challenge.distance_options 
    : [challenge.target_km || 50];

  const [selectedKm, setSelectedKm] = useState<number>(availableDistances[0]);

  const targetKm = participant?.target_km || challenge.target_km || 50;
  const completedKm = participant?.completed_km || 0;
  const percentage = participant?.completion_percentage || 0;
  const remainingKm = Math.max(0, targetKm - completedKm);

  const isMultiRow = availableDistances.length > 3;

  const getDistanceCategory = (km: number) => {
    if (km <= 5) return 'Iniciante • 5K';
    if (km <= 10) return 'Intermediário';
    if (km <= 15) return 'Avançado';
    if (km <= 21) return 'Meia Maratona';
    if (km <= 42) return 'Maratona 42K';
    return 'Ultra Desafio';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.palette.blue1} />
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color={theme.colors.white} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Detalhes do Desafio</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge Hero Header Card */}
        <View style={styles.heroCard}>
          {challenge.image_url ? (
            <Image
              source={{ uri: challenge.image_url }}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.periodPill}>
            <Calendar size={12} color="#0284C7" strokeWidth={2.2} />
            <Text style={styles.periodText}>
              {new Date(challenge.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()} — {new Date(challenge.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.title}>{challenge.name}</Text>
          <Text style={styles.description}>
            {challenge.description || 'Complete o objetivo somando suas atividades no app e garanta sua premiação oficial.'}
          </Text>

          {/* 3 Metrics Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{participant ? 'SUA META' : 'OPÇÕES'}</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {participant 
                  ? `${targetKm} km` 
                  : availableDistances.length > 3
                    ? `${availableDistances[0]}k a ${availableDistances[availableDistances.length - 1]}k`
                    : availableDistances.map(k => `${k}k`).join(' • ')}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>ATLETAS</Text>
              <Text style={styles.metaValue}>{participantsCount > 0 ? participantsCount : 124}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>POSIÇÃO</Text>
              <Text style={styles.metaValue}>{rankingPosition > 0 ? `${rankingPosition}º` : '--'}</Text>
            </View>
          </View>
        </View>

        {/* Progress Card (if joined) or Join Card with Distance Selection */}
        {participant ? (
          <View style={styles.progressHeroCard}>
            <View style={styles.progressHeroLeft}>
              <Text style={styles.sectionTitle}>SEU PROGRESSO NA META DE {targetKm} KM</Text>
              <Text style={styles.progressKm}>
                {completedKm.toFixed(1)} <Text style={styles.progressTargetKm}>/ {targetKm} km</Text>
              </Text>
              <Text style={styles.remainingBadge}>
                {percentage >= 100 ? '✓ META CONCLUÍDA' : `Faltam ${remainingKm.toFixed(1)} km`}
              </Text>
            </View>

            <View style={styles.progressHeroRight}>
              <CircularProgressRing
                percentage={percentage}
                size={95}
                strokeWidth={9}
                color={theme.colors.brandBlue}
                backgroundColor="#E2E8F0"
                centerText={`${Math.round(percentage)}%`}
                subText="META"
              />
            </View>
          </View>
        ) : (
          <View style={styles.joinCard}>
            <View style={styles.joinIconWrap}>
              <Flame size={24} color="#C2410C" strokeWidth={2.4} />
            </View>
            <Text style={styles.joinTitle}>Escolha sua Meta</Text>
            <Text style={styles.joinSubtitle}>
              Selecione quantos quilômetros você quer percorrer neste desafio. Uma vez escolhida, sua meta fica fixada:
            </Text>

            {/* Distance Options Grid/Row (Responsive for any number of options) */}
            <View style={[styles.distanceOptionsContainer, isMultiRow && styles.distanceOptionsContainerGrid]}>
              {availableDistances.map((km) => {
                const isSelected = selectedKm === km;
                return (
                  <TouchableOpacity
                    key={km}
                    onPress={() => setSelectedKm(km)}
                    style={[
                      styles.distanceOptionCard,
                      isMultiRow ? styles.distanceOptionCardGrid : styles.distanceOptionCardRow,
                      isSelected && styles.distanceOptionCardActive,
                    ]}
                    activeOpacity={0.85}
                  >
                    <View style={styles.distanceOptionTop}>
                      <View style={styles.kmBadgeRow}>
                        <Text style={[
                          styles.distanceOptionKm, 
                          isMultiRow && styles.distanceOptionKmGrid,
                          isSelected && styles.distanceOptionKmActive
                        ]}>
                          {km}
                        </Text>
                        <Text style={[
                          styles.distanceOptionUnit, 
                          isSelected && styles.distanceOptionKmActive
                        ]}>
                          KM
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.optionCheckActive}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={styles.optionCheckInactive} />
                      )}
                    </View>
                    <Text 
                      style={[
                        styles.distanceOptionSub, 
                        isMultiRow && styles.distanceOptionSubGrid,
                        isSelected && styles.distanceOptionSubActive
                      ]}
                      numberOfLines={1}
                    >
                      {isMultiRow ? getDistanceCategory(km) : 'Meta do Desafio'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bonusXpRow}>
              <Flame size={14} color="#C2410C" />
              <Text style={styles.bonusXpText}>
                Inscrição: <Text style={{ fontWeight: '800', color: theme.colors.primaryDark }}>+{challenge.xp_join} XP</Text> ao confirmar
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => onJoinChallenge(selectedKm)} 
              style={styles.joinButton} 
              activeOpacity={0.88}
            >
              <Text style={styles.joinButtonText}>
                PARTICIPAR COM META DE {selectedKm} KM
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rewards & Rules Section (Reference Item Cards) */}
        <View style={styles.rewardsCard}>
          <Text style={styles.sectionTitle}>PREMIAÇÕES & REGRAS</Text>
          <View style={styles.rewardList}>
            {challenge.has_medal && (
              <View style={styles.rewardItem}>
                <View style={[styles.rewardIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Award size={20} color="#D97706" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rewardTitle}>Medalha Física Oficial</Text>
                  <Text style={styles.rewardDesc}>Enviada diretamente ao endereço do atleta após atingir 100% da meta.</Text>
                </View>
              </View>
            )}

            {challenge.has_certificate && (
              <View style={styles.rewardItem}>
                <View style={[styles.rewardIconWrap, { backgroundColor: '#E0F2FE' }]}>
                  <ShieldCheck size={20} color="#0284C7" strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.rewardTitle}>Certificado Digital Autêntico</Text>
                  <Text style={styles.rewardDesc}>Emitido automaticamente com código exclusivo de validação.</Text>
                </View>
              </View>
            )}

            <View style={styles.rewardItem}>
              <View style={[styles.rewardIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Target size={20} color="#16A34A" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rewardTitle}>Distância Mínima</Text>
                <Text style={styles.rewardDesc}>Mínimo de {challenge.min_km_per_activity} km por corrida para computar no desafio.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={onStartRun} style={styles.startRunButton} activeOpacity={0.88}>
            <Play size={18} color={theme.colors.white} fill={theme.colors.white} />
            <Text style={styles.startRunText}>INICIAR CORRIDA PARA ESTE DESAFIO</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onViewRanking} style={styles.rankingButton} activeOpacity={0.8}>
            <BarChart2 size={16} color={theme.colors.brandBlue} strokeWidth={2.2} />
            <Text style={styles.rankingButtonText}>VER RANKING DO DESAFIO</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.palette.blue1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: theme.colors.palette.blue1,
  },
  backButton: {
    padding: 8,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: -0.2,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '100%',
  },
  heroCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 20,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
  },
  heroBannerImage: {
    width: '100%',
    height: 160,
    borderRadius: theme.radius.lg,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.4,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.borderLight,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },

  // Progress Hero Card
  progressHeroCard: {
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
  progressHeroLeft: {
    flex: 1,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  progressKm: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  progressTargetKm: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  remainingBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brandBlue,
  },
  progressHeroRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Join Card
  joinCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 10,
  },
  joinIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  joinSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  distanceOptionsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  distanceOptionsContainerGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 10,
  },
  distanceOptionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  distanceOptionCardRow: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 64,
  },
  distanceOptionCardGrid: {
    width: '48.5%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 70,
  },
  distanceOptionCardActive: {
    borderColor: theme.colors.brandBlue,
    backgroundColor: 'rgba(1, 79, 134, 0.06)',
  },
  distanceOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  kmBadgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  distanceOptionKm: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  distanceOptionKmGrid: {
    fontSize: 18,
  },
  distanceOptionUnit: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  distanceOptionKmActive: {
    color: theme.colors.brandBlue,
  },
  optionCheckActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckInactive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  distanceOptionSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  distanceOptionSubGrid: {
    fontSize: 12,
  },
  distanceOptionSubActive: {
    color: theme.colors.brandBlue,
    fontWeight: '700',
  },
  bonusXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  bonusXpText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  joinButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: theme.radius.full,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
    ...theme.shadows.floating,
  },
  joinButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Rewards Card
  rewardsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 20,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 16,
  },
  rewardList: {
    gap: 14,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rewardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  rewardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },

  // Actions
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  startRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 16,
    borderRadius: theme.radius.xl,
    ...theme.shadows.floating,
  },
  startRunText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  rankingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    paddingVertical: 14,
    borderRadius: theme.radius.xl,
  },
  rankingButtonText: {
    color: theme.colors.brandBlue,
    fontSize: 13,
    fontWeight: '800',
  },
});
