import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, UrlTile } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Clock,
  Zap,
  Flame,
  Gauge,
  Share2,
  Trash2,
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Flag
} from 'lucide-react-native';
import { theme } from '../theme';
import { Activity, RunPoint, formatDuration, calculateAverageSpeedKmh } from '@corro-por-amor/shared';
import { RunPhotoShareModal } from './RunPhotoShareModal';
import { RouteThumbnail } from './RouteThumbnail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActivityDetailModalProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
  onDeleteActivity?: (activityId: string) => Promise<void>;
  onSavePhoto?: (activityId: string, photoUri: string) => Promise<void>;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  visible,
  activity,
  onClose,
  onDeleteActivity,
  onSavePhoto,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  // Extract coordinates from route_geojson if available
  const routePoints: RunPoint[] = React.useMemo(() => {
    if (!activity?.route_geojson) return [];
    if (Array.isArray(activity.route_geojson)) return activity.route_geojson as unknown as RunPoint[];
    if (Array.isArray(activity.route_geojson.coordinates)) {
      const coords = activity.route_geojson.coordinates;
      if (coords.length > 0) {
        if (typeof coords[0] === 'object' && 'latitude' in coords[0]) {
          return coords as unknown as RunPoint[];
        }
        if (Array.isArray(coords[0])) {
          return (coords as [number, number][]).map(([lon, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lon,
            timestamp: Date.now(),
          }));
        }
      }
    }
    if (Array.isArray(activity.route_geojson.points)) {
      return activity.route_geojson.points as unknown as RunPoint[];
    }
    return [];
  }, [activity?.route_geojson]);

  // Auto-fit map to route coordinates
  useEffect(() => {
    if (routePoints.length > 1 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          routePoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
          {
            edgePadding: { top: 30, right: 30, bottom: 30, left: 30 },
            animated: true,
          }
        );
      }, 400);
    }
  }, [routePoints]);

  if (!activity) return null;

  const runDate = new Date(activity.created_at);
  const dateStr = runDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = runDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const isPending = activity.status === 'pending_review';
  const isRejected = activity.status === 'rejected';
  const isOffline = activity.id.startsWith('offline-');

  const avgSpeed = calculateAverageSpeedKmh(activity.distance_km, activity.moving_seconds);
  const estimatedCalories = Math.round(activity.distance_km * 68);

  const initialRegion = useMemo(() => {
    if (routePoints.length === 0) {
      return {
        latitude: -15.7975,
        longitude: -47.8919,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
    }
    let minLat = routePoints[0].latitude;
    let maxLat = routePoints[0].latitude;
    let minLng = routePoints[0].longitude;
    let maxLng = routePoints[0].longitude;
    for (const pt of routePoints) {
      if (pt.latitude < minLat) minLat = pt.latitude;
      if (pt.latitude > maxLat) maxLat = pt.latitude;
      if (pt.longitude < minLng) minLng = pt.longitude;
      if (pt.longitude > maxLng) maxLng = pt.longitude;
    }
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = Math.max((maxLat - minLat) * 1.4, 0.005);
    const lngDelta = Math.max((maxLng - minLng) * 1.4, 0.005);
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [routePoints]);

  useEffect(() => {
    if (routePoints.length > 1 && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(routePoints, {
          edgePadding: { top: 35, right: 35, bottom: 35, left: 35 },
          animated: false,
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [routePoints]);

  // Handle Photo Picker
  const handlePickPhoto = async () => {
    if (!onSavePhoto) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão Necessária', 'Permita o acesso à galeria para anexar sua foto da corrida.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsUploadingPhoto(true);
        try {
          await onSavePhoto(activity.id, result.assets[0].uri);
          Alert.alert('Sucesso', 'Foto anexada à corrida com sucesso!');
        } catch (err: any) {
          Alert.alert('Erro', 'Não foi possível salvar a foto. Tente novamente.');
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (err: any) {
      console.error('Error selecting photo:', err);
    }
  };

  // Handle Delete
  const handleDeletePress = () => {
    if (!onDeleteActivity) return;
    Alert.alert(
      'Excluir Corrida',
      `Tem certeza que deseja apagar esta corrida de ${activity.distance_km.toFixed(2)} km? Os quilômetros e pontos associados serão deduzidos da sua conta.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDeleteActivity(activity.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Erro', 'Não foi possível excluir a atividade: ' + err.message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Top Modal Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>DETALHES DO TREINO</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {timeStr} • {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
              <X size={20} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status & Source Badges Row */}
            <View style={styles.badgesRow}>
              {isOffline ? (
                <View style={[styles.badgePill, styles.badgeOffline]}>
                  <Text style={styles.badgeOfflineText}>📶 SALVO NO CELULAR (OFFLINE)</Text>
                </View>
              ) : (
                <View style={[styles.badgePill, styles.badgeGps]}>
                  <MapPin size={11} color="#0284C7" strokeWidth={2.4} />
                  <Text style={styles.badgeGpsText}>GPS CORRO POR AMOR</Text>
                </View>
              )}

              {isRejected ? (
                <View style={[styles.badgePill, styles.badgeRejected]}>
                  <AlertCircle size={11} color="#DC2626" strokeWidth={2.4} />
                  <Text style={styles.badgeRejectedText}>NÃO VALIDADA</Text>
                </View>
              ) : isPending ? (
                <View style={[styles.badgePill, styles.badgePending]}>
                  <AlertCircle size={11} color="#D97706" strokeWidth={2.4} />
                  <Text style={styles.badgePendingText}>EM ANÁLISE</Text>
                </View>
              ) : (
                <View style={[styles.badgePill, styles.badgeApproved]}>
                  <CheckCircle2 size={11} color="#059669" strokeWidth={2.4} />
                  <Text style={styles.badgeApprovedText}>VALIDADA</Text>
                </View>
              )}
            </View>

            {/* Rejection / Review Notice */}
            {activity.rejection_reason && (
              <View style={styles.noticeCard}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.noticeCardText}>{activity.rejection_reason}</Text>
              </View>
            )}

            {/* Hero Distance & XP Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroDistanceRow}>
                <Text style={styles.heroDistanceNumber}>
                  {activity.distance_km.toFixed(2)}
                </Text>
                <Text style={styles.heroDistanceUnit}>KM</Text>
              </View>

              <View style={styles.heroXpBadge}>
                <Sparkles size={14} color="#C2410C" strokeWidth={2.4} />
                <Text style={styles.heroXpText}>+{activity.xp_earned} XP CONQUISTADOS</Text>
              </View>
            </View>

            {/* Performance Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Tempo em Movimento */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <Clock size={16} color="#94A3B8" />
                </View>
                <Text style={styles.metricCardLabel}>TEMPO EM MOVIMENTO</Text>
                <Text style={styles.metricCardValue}>
                  {formatDuration(activity.moving_seconds)}
                </Text>
              </View>

              {/* Ritmo Médio */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <Zap size={16} color="#38BDF8" />
                </View>
                <Text style={styles.metricCardLabel}>RITMO MÉDIO</Text>
                <Text style={styles.metricCardValue}>{activity.average_pace}</Text>
              </View>

              {/* Precisão GPS */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <MapPin size={16} color="#F97316" />
                </View>
                <Text style={styles.metricCardLabel}>PRECISÃO DO TRAJETO</Text>
                <Text style={styles.metricCardValue}>{routePoints.length > 0 ? `${routePoints.length} pts` : 'GPS Ativo'}</Text>
              </View>

              {/* Calorias Estimadas */}
              <View style={styles.metricCard}>
                <View style={styles.metricCardIcon}>
                  <Flame size={16} color="#EF4444" />
                </View>
                <Text style={styles.metricCardLabel}>CALORIAS APROX.</Text>
                <Text style={styles.metricCardValue}>{estimatedCalories} kcal</Text>
              </View>
            </View>

            {/* Interactive Route GPS Map */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PERCURSO DA CORRIDA</Text>
              {routePoints.length > 0 && (
                <Text style={styles.sectionSubtitle}>{routePoints.length} pontos de GPS</Text>
              )}
            </View>

            <View style={styles.mapContainer}>
              {routePoints.length > 1 && Platform.OS !== 'web' ? (
                <MapView
                  ref={mapRef}
                  style={StyleSheet.absoluteFill}
                  initialRegion={initialRegion}
                  mapType="standard"
                  scrollEnabled={false}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >

                  {/* Glow Casing (Waze/Strava) */}
                  <Polyline
                    coordinates={routePoints}
                    strokeColor="rgba(255, 87, 34, 0.32)"
                    strokeWidth={10}
                    lineCap="round"
                    lineJoin="round"
                    zIndex={10}
                  />
                  {/* Neon Core */}
                  <Polyline
                    coordinates={routePoints}
                    strokeColor="#FF5722"
                    strokeWidth={5}
                    lineCap="round"
                    lineJoin="round"
                    zIndex={11}
                  />

                  {/* Start Point */}
                  <Marker
                    coordinate={{
                      latitude: routePoints[0].latitude,
                      longitude: routePoints[0].longitude,
                    }}
                    title="Ponto de Partida"
                    anchor={{ x: 0.5, y: 0.5 }}
                    zIndex={20}
                  >
                    <View style={styles.mapStartMarker}>
                      <View style={styles.mapStartMarkerInner} />
                    </View>
                  </Marker>

                  {/* Finish Point */}
                  <Marker
                    coordinate={{
                      latitude: routePoints[routePoints.length - 1].latitude,
                      longitude: routePoints[routePoints.length - 1].longitude,
                    }}
                    title="Ponto de Chegada"
                    anchor={{ x: 0.5, y: 0.5 }}
                    zIndex={25}
                  >
                    <View style={styles.mapFinishMarker}>
                      <Flag size={11} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                  </Marker>
                </MapView>
              ) : (
                <View style={styles.noMapPlaceholder}>
                  {routePoints.length > 1 ? (
                    <RouteThumbnail
                      coordinates={routePoints}
                      width={240}
                      height={140}
                      strokeColor="#FF5722"
                      strokeWidth={3.5}
                      glow={true}
                    />
                  ) : (
                    <>
                      <MapPin size={28} color="#64748B" strokeWidth={1.8} />
                      <Text style={styles.noMapTitle}>Trajeto Registrado</Text>
                      <Text style={styles.noMapSubtitle}>
                        Esta atividade foi sincronizada com a distância e ritmo oficiais.
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Attached Photo Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FOTO DA CORRIDA</Text>
            </View>

            {activity.photo_url ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: activity.photo_url }} style={styles.photoImage} resizeMode="cover" />
                <TouchableOpacity
                  onPress={handlePickPhoto}
                  style={styles.changePhotoButton}
                  activeOpacity={0.8}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Camera size={14} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={styles.changePhotoText}>Trocar Foto</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={styles.addPhotoDashed}
                activeOpacity={0.8}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#38BDF8" />
                ) : (
                  <>
                    <View style={styles.addPhotoIconCircle}>
                      <Camera size={20} color="#38BDF8" strokeWidth={2.2} />
                    </View>
                    <Text style={styles.addPhotoTitle}>Anexar Foto da Corrida</Text>
                    <Text style={styles.addPhotoSubtitle}>
                      Mostre seu momento de superação e personalize seu card para as redes!
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Strava Share Promo Button */}
            <TouchableOpacity
              onPress={() => setShowShareModal(true)}
              style={styles.stravaShareButton}
              activeOpacity={0.88}
            >
              <View style={styles.stravaShareIconWrap}>
                <Sparkles size={18} color="#FF5500" strokeWidth={2.4} />
              </View>
              <View style={styles.stravaShareTexts}>
                <Text style={styles.stravaShareTitle}>Personalizar & Compartilhar Card</Text>
                <Text style={styles.stravaShareSub}>
                  Compartilhe seu percurso, métricas e foto no Instagram Story / Feed
                </Text>
              </View>
              <ChevronRight size={18} color="#FF5500" strokeWidth={2.4} />
            </TouchableOpacity>

            {/* Delete Activity Button */}
            {onDeleteActivity && (
              <TouchableOpacity
                onPress={handleDeletePress}
                style={styles.deleteRunButton}
                activeOpacity={0.8}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Trash2 size={16} color="#DC2626" strokeWidth={2.2} />
                    <Text style={styles.deleteRunText}>Excluir esta Corrida</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Embedded Strava Card Generator Modal */}
      <RunPhotoShareModal
        visible={showShareModal}
        distanceKm={activity.distance_km}
        movingSeconds={activity.moving_seconds}
        averagePace={activity.average_pace}
        calories={estimatedCalories}
        routeCoordinates={routePoints}
        initialPhotoUri={activity.photo_url || null}
        onSavePhoto={onSavePhoto ? (uri) => onSavePhoto(activity.id, uri) : undefined}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    maxWidth: SCREEN_WIDTH - 80,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  badgeOffline: {
    backgroundColor: 'rgba(194, 65, 12, 0.15)',
    borderColor: '#C2410C',
  },
  badgeOfflineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 0.5,
  },
  badgeStrava: {
    backgroundColor: 'rgba(252, 76, 2, 0.15)',
    borderColor: '#FC4C02',
  },
  badgeStravaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FC4C02',
    letterSpacing: 0.5,
  },
  badgeGps: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeGpsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  badgeApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeApprovedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgePendingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  badgeRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  badgeRejectedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },

  // Notice Card
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  noticeCardText: {
    fontSize: 12,
    color: '#FCA5A5',
    flex: 1,
    lineHeight: 16,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: theme.radius.xl,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroDistanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroDistanceNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 62,
  },
  heroDistanceUnit: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FACC15',
    letterSpacing: 1,
  },
  heroXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234, 88, 12, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.35)',
    marginTop: 8,
  },
  heroXpText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FB923C',
    letterSpacing: 0.5,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#1E293B',
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricCardIcon: {
    marginBottom: 6,
  },
  metricCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  // Map Container
  mapContainer: {
    height: 200,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1E293B',
  },
  mapStartDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapFinishDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  noMapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1E293B',
  },
  noMapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  noMapSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 240,
  },

  // Photo Container
  photoContainer: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    position: 'relative',
    height: 240,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  changePhotoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addPhotoDashed: {
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  addPhotoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  addPhotoSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 15,
  },

  // Strava Share Button
  stravaShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 85, 0, 0.35)',
    marginTop: 6,
  },
  stravaShareIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 85, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stravaShareTexts: {
    flex: 1,
  },
  stravaShareTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stravaShareSub: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 14,
  },

  // Delete Activity Button
  deleteRunButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    marginTop: 4,
  },
  deleteRunText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  mapStartMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapStartMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapFinishMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});
