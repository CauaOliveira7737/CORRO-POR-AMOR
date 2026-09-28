import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Flame, Award, ChevronRight, Share2, Clock, Zap, MapPin, Camera, Sparkles } from 'lucide-react-native';
import { theme } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { RunPhotoShareModal } from '../components/RunPhotoShareModal';
import { formatDuration, Challenge, ChallengeParticipant, RunPoint } from '@corro-por-amor/shared';

interface RunResultScreenProps {
  distanceKm: number;
  movingSeconds: number;
  pausedSeconds: number;
  averagePace: string;
  challenge: Challenge | null;
  participant: ChallengeParticipant | null;
  xpEarned: number;
  isFlaggedForReview?: boolean;
  isOfflineSaved?: boolean;
  routeCoordinates?: RunPoint[];
  onSavePhoto?: (photoUri: string) => Promise<void>;
  onContinue: () => void;
}

export const RunResultScreen: React.FC<RunResultScreenProps> = ({
  distanceKm,
  movingSeconds,
  pausedSeconds,
  averagePace,
  challenge,
  participant,
  xpEarned,
  isFlaggedForReview = false,
  isOfflineSaved = false,
  routeCoordinates = [],
  onSavePhoto,
  onContinue,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [attachedPhotoUri, setAttachedPhotoUri] = useState<string | null>(null);

  const currentKm = participant ? participant.completed_km : distanceKm;
  const targetKm = participant?.target_km || challenge?.target_km || 50;
  const percentage = participant ? participant.completion_percentage : (currentKm / targetKm) * 100;

  const handlePhotoSaved = async (photoUri: string) => {
    setAttachedPhotoUri(photoUri);
    if (onSavePhoto) {
      await onSavePhoto(photoUri);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Celebration Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, isOfflineSaved && { backgroundColor: '#E0F2FE' }]}>
            <CheckCircle2 size={40} color={isOfflineSaved ? '#0284C7' : '#10B981'} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>
            {isOfflineSaved ? 'CORRIDA GRAVADA OFFLINE!' : 'CORRIDA CONCLUÍDA!'}
          </Text>
          <Text style={styles.subtitle}>
            {isOfflineSaved 
              ? 'Seus dados foram salvos com segurança no seu celular.' 
              : 'Sua atividade foi validada com sucesso.'}
          </Text>
        </View>

        {/* Offline Notice Banner */}
        {isOfflineSaved && (
          <View style={styles.offlineNoticeCard}>
            <Text style={styles.offlineNoticeTitle}>📱 Armazenado no Dispositivo</Text>
            <Text style={styles.offlineNoticeText}>
              Seus quilômetros já foram somados na tela. Assim que seu celular detectar conexão com a internet, este treino será sincronizado automaticamente com os servidores oficiais.
            </Text>
          </View>
        )}

        {/* Main Distance Hero Card */}
        <View style={styles.card}>
          <View style={styles.distanceBlock}>
            <Text style={styles.distanceValue}>{distanceKm.toFixed(2)}</Text>
            <Text style={styles.distanceUnit}>QUILÔMETROS PERCORRIDOS</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statHeaderRow}>
                <Clock size={12} color={theme.colors.textSecondary} />
                <Text style={styles.statLabel}>Tempo</Text>
              </View>
              <Text style={styles.statValue}>{formatDuration(movingSeconds)}</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeaderRow}>
                <Zap size={12} color={theme.colors.brandBlue} />
                <Text style={styles.statLabel}>Ritmo Médio</Text>
              </View>
              <Text style={styles.statValue}>{averagePace}</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeaderRow}>
                <Flame size={12} color="#C2410C" />
                <Text style={styles.statLabel}>Calorias</Text>
              </View>
              <Text style={styles.statValue}>{Math.round(distanceKm * 65)} kcal</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statHeaderRow}>
                <Award size={12} color="#0284C7" />
                <Text style={styles.statLabel}>XP Ganho</Text>
              </View>
              <Text style={[styles.statValue, { color: theme.colors.brandBlue }]}>+{xpEarned} XP</Text>
            </View>
          </View>
        </View>

        {/* Flagged Review Alert if Anomaly Detected */}
        {isFlaggedForReview && (
          <View style={styles.flaggedCard}>
            <Text style={styles.flaggedTitle}>Atividade em Revisão pelo Organizador</Text>
            <Text style={styles.flaggedText}>
              Detectamos um ritmo atípico nesta atividade. O organizador irá conferir antes de atualizar o ranking oficial.
            </Text>
          </View>
        )}

        {/* Challenge Progress Update Card */}
        {challenge && (
          <View style={styles.card}>
            <View style={styles.challengeHeaderRow}>
              <Text style={styles.challengeTag}>PROGRESSO NO DESAFIO</Text>
              <Text style={styles.challengePercentText}>{Math.round(percentage)}%</Text>
            </View>
            <Text style={styles.challengeName}>{challenge.name}</Text>

            <View style={styles.progressRow}>
              <Text style={styles.progressKmText}>
                {currentKm.toFixed(2)} <Text style={styles.progressTargetText}>/ {targetKm} km</Text>
              </Text>
            </View>

            <ProgressBar percentage={percentage} height={10} />

            <View style={styles.remainingPill}>
              <Text style={styles.remainingText}>
                {percentage >= 100 
                  ? '🎉 PARABÉNS! VOCÊ COMPLETOU O DESAFIO!' 
                  : `Faltam apenas ${(targetKm - currentKm).toFixed(2)} km para a medalha!`}
              </Text>
            </View>
          </View>
        )}

        {/* Photo Share Card (Strava style) */}
        <TouchableOpacity
          onPress={() => setShowShareModal(true)}
          style={styles.photoShareCard}
          activeOpacity={0.88}
        >
          <View style={styles.photoShareLeft}>
            <View style={styles.photoIconCircle}>
              <Camera size={22} color="#FF5500" strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.photoShareTitle}>FOTO COM DADOS DA CORRIDA</Text>
                <Sparkles size={14} color="#FF5500" />
              </View>
              <Text style={styles.photoShareSubtitle}>
                {attachedPhotoUri 
                  ? 'Foto anexada! Toque para editar ou compartilhar.' 
                  : 'Gere um card personalizado para Stories ou Feed com sua foto!'}
              </Text>
            </View>
          </View>
          {attachedPhotoUri ? (
            <Image source={{ uri: attachedPhotoUri }} style={styles.photoThumbnail} />
          ) : (
            <View style={styles.photoAddBadge}>
              <Text style={styles.photoAddBadgeText}>+ FOTO</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Share & Continue Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            onPress={() => setShowShareModal(true)}
            style={styles.shareButton}
            activeOpacity={0.85}
          >
            <Share2 size={18} color={theme.colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.shareButtonText}>COMPARTILHAR COM FOTO</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onContinue}
            style={styles.continueButton}
            activeOpacity={0.88}
          >
            <Text style={styles.continueButtonText}>CONTINUAR PARA O INÍCIO</Text>
            <ChevronRight size={18} color={theme.colors.white} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Strava-style Photo Share Modal */}
      <RunPhotoShareModal
        visible={showShareModal}
        distanceKm={distanceKm}
        movingSeconds={movingSeconds}
        averagePace={averagePace}
        calories={Math.round(distanceKm * 65)}
        routeCoordinates={routeCoordinates}
        initialPhotoUri={attachedPhotoUri}
        onSavePhoto={handlePhotoSaved}
        onClose={() => setShowShareModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 20,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 16,
  },
  distanceBlock: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  distanceValue: {
    fontSize: 54,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -1,
  },
  distanceUnit: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  flaggedCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.radius.lg,
    padding: 16,
    gap: 4,
  },
  flaggedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  flaggedText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeTag: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  challengePercentText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.brandBlue,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  progressRow: {
    marginBottom: -4,
  },
  progressKmText: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  progressTargetText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  remainingPill: {
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    padding: 10,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brandBlue,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    paddingVertical: 15,
    borderRadius: theme.radius.xl,
    ...theme.shadows.card,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: 0.4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 16,
    borderRadius: theme.radius.xl,
    ...theme.shadows.floating,
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  offlineNoticeCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: 16,
    gap: 6,
  },
  offlineNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
  },
  offlineNoticeText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 18,
  },
  photoShareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    padding: 16,
    borderRadius: theme.radius.xl,
    ...theme.shadows.card,
  },
  photoShareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  photoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoShareTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.6,
  },
  photoShareSubtitle: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 16,
    marginTop: 2,
  },
  photoThumbnail: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  photoAddBadge: {
    backgroundColor: '#FF5500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  photoAddBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
