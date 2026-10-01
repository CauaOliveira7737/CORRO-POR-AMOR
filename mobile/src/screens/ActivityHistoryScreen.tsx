import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { 
  Activity as ActivityIcon, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Share2,
  ChevronRight,
  Flame,
  Zap,
  TrendingUp,
  X,
  Trash2,
  Camera,
  Sparkles
} from 'lucide-react-native';
import { theme } from '../theme';
import { Activity, RunPoint } from '@corro-por-amor/shared';
import { RunPhotoShareModal } from '../components/RunPhotoShareModal';
import { ActivityDetailModal } from '../components/ActivityDetailModal';

const extractRouteCoordinates = (geojson: any): RunPoint[] => {
  if (!geojson) return [];
  if (Array.isArray(geojson.points)) return geojson.points;
  if (Array.isArray(geojson.coordinates)) {
    const coords = geojson.coordinates;
    if (coords.length > 0 && typeof coords[0] === 'object' && 'latitude' in coords[0]) {
      return coords;
    }
    return coords.map((c: any) => ({
      latitude: c[1] || c.lat || 0,
      longitude: c[0] || c.lng || 0,
      altitude: 0,
      speed: 0,
      timestamp: Date.now(),
    }));
  }
  if (Array.isArray(geojson)) return geojson;
  return [];
};

interface ActivityHistoryScreenProps {
  activities: Activity[];
  onSelectActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => Promise<void>;
  onSavePhoto?: (activityId: string, photoUri: string) => Promise<void>;
}

export const ActivityHistoryScreen: React.FC<ActivityHistoryScreenProps> = ({
  activities,
  onSelectActivity,
  onDeleteActivity,
  onSavePhoto,
}) => {
  const [selectedShareActivity, setSelectedShareActivity] = useState<Activity | null>(null);
  const [selectedDetailActivity, setSelectedDetailActivity] = useState<Activity | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (act: Activity) => {
    if (!onDeleteActivity) return;
    Alert.alert(
      'Excluir Corrida',
      `Deseja realmente apagar esta corrida de ${act.distance_km.toFixed(2)} km? Os quilômetros e pontos associados serão deduzidos do seu perfil.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            setDeletingId(act.id);
            try {
              await onDeleteActivity(act.id);
            } finally {
              setDeletingId(null);
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageSubtitle}>SUAS CORRIDAS</Text>
        <Text style={styles.pageTitle}>Histórico de Atividades</Text>
      </View>

      {/* Activities List */}
      <ScrollView 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>ÚLTIMAS CORRIDAS</Text>
          <Text style={styles.listHeaderCount}>{activities.length} registradas</Text>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <ActivityIcon size={32} color={theme.colors.brandBlue} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma corrida registrada ainda</Text>
            <Text style={styles.emptySubtitle}>
              Vá para a aba Início e toque em "INICIAR CORRIDA" para começar a somar seus quilômetros com o GPS!
            </Text>
          </View>
        ) : (
          activities.map((act) => {
            const isPending = act.status === 'pending_review';
            const runDate = new Date(act.created_at);
            const dateStr = runDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
            const timeStr = runDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return (
              <TouchableOpacity
                key={act.id}
                onPress={() => {
                  setSelectedDetailActivity(act);
                  onSelectActivity?.(act);
                }}
                style={[styles.activityCard, deletingId === act.id && { opacity: 0.5 }]}
                activeOpacity={0.88}
              >
                {/* Left Column: Photo or Icon */}
                {act.photo_url ? (
                  <View style={styles.activityPhotoWrap}>
                    <Image source={{ uri: act.photo_url }} style={styles.activityPhotoImg} />
                    <View style={styles.cameraDot}>
                      <Camera size={8} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.activityIconWrap}>
                    <ActivityIcon 
                      size={20} 
                      color={theme.colors.brandBlue} 
                      strokeWidth={2.4} 
                    />
                  </View>
                )}

                {/* Center Column: Distance & Details */}
                <View style={styles.activityMain}>
                  <View style={styles.activityTitleRow}>
                    <Text style={styles.distanceValue}>
                      {act.distance_km.toFixed(2)} <Text style={styles.distanceKm}>km</Text>
                    </Text>
                    {act.id.startsWith('offline-') ? (
                      <View style={[styles.statusBadge, styles.statusBadgeOffline]}>
                        <Text style={[styles.statusBadgeText, styles.statusBadgeTextOffline]}>
                          📶 SALVO NO CELULAR
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, isPending ? styles.statusBadgePending : styles.statusBadgeApproved]}>
                        <Text style={[styles.statusBadgeText, isPending ? styles.statusBadgeTextPending : styles.statusBadgeTextApproved]}>
                          {isPending ? 'EM ANÁLISE' : '✓ VALIDADA'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Submetrics row */}
                  <View style={styles.submetricsRow}>
                    <View style={styles.submetricItem}>
                      <Clock size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.submetricText}>
                        {Math.floor(act.moving_seconds / 60)}m {act.moving_seconds % 60}s
                      </Text>
                    </View>

                    <Text style={styles.dotSeparator}>•</Text>

                    <View style={styles.submetricItem}>
                      <Zap size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.submetricText}>{act.average_pace}</Text>
                    </View>

                    <Text style={styles.dotSeparator}>•</Text>

                    <View style={styles.submetricItem}>
                      <Flame size={12} color="#C2410C" />
                      <Text style={[styles.submetricText, { color: '#C2410C', fontWeight: '700' }]}>
                        +{act.xp_earned} XP
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Right Column: Date, Time & Action Buttons */}
                <View style={styles.activityRight}>
                  <Text style={styles.dateLabel}>{dateStr}</Text>
                  <Text style={styles.timeLabel}>{timeStr}</Text>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setSelectedShareActivity(act);
                      }}
                      style={styles.photoShareMiniButton}
                      activeOpacity={0.75}
                      accessibilityLabel="Gerar Card com Foto"
                    >
                      <Camera size={13} color="#FF5500" strokeWidth={2.4} />
                    </TouchableOpacity>

                    {onDeleteActivity && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleDelete(act);
                        }}
                        style={styles.deleteButton}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={14} color="#DC2626" strokeWidth={2.2} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Photo Share Modal */}

      {/* Strava Photo Share Modal */}
      {selectedShareActivity && (
        <RunPhotoShareModal
          visible={!!selectedShareActivity}
          distanceKm={selectedShareActivity.distance_km}
          movingSeconds={selectedShareActivity.moving_seconds}
          averagePace={selectedShareActivity.average_pace}
          calories={Math.round(selectedShareActivity.distance_km * 65)}
          routeCoordinates={extractRouteCoordinates(selectedShareActivity.route_geojson)}
          initialPhotoUri={selectedShareActivity.photo_url || null}
          onSavePhoto={async (photoUri) => {
            if (onSavePhoto && selectedShareActivity) {
              await onSavePhoto(selectedShareActivity.id, photoUri);
            }
          }}
          onClose={() => setSelectedShareActivity(null)}
        />
      )}

      {/* Activity Details Modal */}
      {selectedDetailActivity && (
        <ActivityDetailModal
          visible={!!selectedDetailActivity}
          activity={selectedDetailActivity}
          onClose={() => setSelectedDetailActivity(null)}
          onDeleteActivity={onDeleteActivity}
          onSavePhoto={onSavePhoto}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  pageSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110, // Clears floating dock
    gap: 12,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  listHeaderCount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brandBlue,
  },

  // Activity Card
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 16,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 14,
  },
  activityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityMain: {
    flex: 1,
    gap: 6,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  distanceKm: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  statusBadgeApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeOffline: {
    backgroundColor: '#E0F2FE',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextApproved: {
    color: '#059669',
  },
  statusBadgeTextPending: {
    color: '#B45309',
  },
  statusBadgeTextOffline: {
    color: '#0284C7',
  },
  submetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  submetricText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  dotSeparator: {
    fontSize: 10,
    color: theme.colors.borderSubtle,
  },
  activityRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginTop: 2,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 30,
    alignItems: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 12,
    marginTop: 10,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(1, 42, 74, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xxl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.floating,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  modalDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  modalFeatures: {
    gap: 10,
    backgroundColor: theme.colors.subtleGray,
    padding: 14,
    borderRadius: theme.radius.lg,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  modalAuthButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 14,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  modalAuthText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  activityPhotoWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  activityPhotoImg: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.md,
  },
  cameraDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF5500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  photoShareMiniButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
