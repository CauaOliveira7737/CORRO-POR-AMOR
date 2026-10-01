import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker, UrlTile } from 'react-native-maps';
import { 
  Pause, 
  Play, 
  Flag, 
  AlertCircle, 
  Zap, 
  Clock, 
  LocateFixed, 
  Gauge
} from 'lucide-react-native';
import { theme } from '../theme';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { formatDuration, Challenge } from '@corro-por-amor/shared';
import { RunTrackerState } from '../hooks/useRunTracker';

interface ActiveRunScreenProps {
  tracker: RunTrackerState & {
    pauseManual: () => void;
    resumeManual: () => void;
    finishRun: () => void;
  };
  activeChallenge: Challenge | null;
  onFinishConfirmed: () => void;
}

export const ActiveRunScreen: React.FC<ActiveRunScreenProps> = ({
  tracker,
  activeChallenge,
  onFinishConfirmed,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const isPaused = tracker.status === 'paused';
  
  // Real-time position: current GPS fix or latest recorded route point
  const currentPos = tracker.currentLocation || (
    tracker.routePoints.length > 0 
      ? tracker.routePoints[tracker.routePoints.length - 1] 
      : null
  );

  // Auto-follow runner on map when running or when first GPS fix is acquired
  useEffect(() => {
    if (currentPos && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 600);
    }
  }, [currentPos?.latitude, currentPos?.longitude, tracker.status]);

  const handleRecenter = () => {
    if (currentPos && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentPos.latitude,
        longitude: currentPos.longitude,
        latitudeDelta: 0.0035,
        longitudeDelta: 0.0035,
      }, 400);
    }
  };

  const handleFinishPress = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmFinish = () => {
    setShowConfirmModal(false);
    tracker.finishRun();
    onFinishConfirmed();
  };

  // Initial map center: athlete's current location or Brasília fallback
  const initialRegion = {
    latitude: currentPos?.latitude || -15.7975,
    longitude: currentPos?.longitude || -47.8919,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };

  return (
    <View style={styles.container}>
      {/* 1. Full-Screen GPS Live Map */}
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webMapFallback]}>
          <Text style={styles.webMapFallbackTitle}>🗺️ Percurso GPS em Tempo Real</Text>
          <Text style={styles.webMapFallbackCoords}>
            {currentPos ? `Lat: ${currentPos.latitude.toFixed(5)} • Lon: ${currentPos.longitude.toFixed(5)}` : 'Aguardando coordenadas GPS...'}
          </Text>
          <Text style={styles.webMapFallbackSub}>
            O mapa visual completo via satélite é renderizado nativamente no celular / Expo Go.
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={true}
          followsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          toolbarEnabled={false}
          mapType="standard"
        >

          {/* Real-time Route Polyline in Energetic Orange */}
          {tracker.routePoints.length > 1 && (
            <Polyline
              coordinates={tracker.routePoints}
              strokeColor="#FF5500"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
              zIndex={10}
            />
          )}

          {/* Start Point Marker */}
          {tracker.routePoints.length > 0 && (
            <Marker
              coordinate={{
                latitude: tracker.routePoints[0].latitude,
                longitude: tracker.routePoints[0].longitude,
              }}
              title="Ponto de Partida"
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={20}
            >
              <View style={styles.startMarker}>
                <View style={styles.startMarkerInner} />
              </View>
            </Marker>
          )}

          {/* Live Runner Position Marker */}
          {currentPos && (
            <Marker
              coordinate={{
                latitude: currentPos.latitude,
                longitude: currentPos.longitude,
              }}
              title="Sua Posição"
              anchor={{ x: 0.5, y: 0.5 }}
              flat
              zIndex={30}
            >
              <View style={styles.runnerMarkerOuter}>
                <View style={styles.runnerMarkerPulse} />
                <View style={styles.runnerMarkerCore} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* 2. Floating HUD Overlay on top of Map */}
      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        {/* Top Status & Recenter Bar */}
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={styles.challengePill}>
            <Text style={styles.challengePillText} numberOfLines={1}>
              {activeChallenge ? activeChallenge.name : 'Corrida Livre'}
            </Text>
          </View>

          <View style={styles.topRightControls}>
            <View style={styles.gpsIndicator}>
              <View 
                style={[
                  styles.gpsDot, 
                  { 
                    backgroundColor: tracker.isGpsAcquired 
                      ? '#10B981' 
                      : tracker.hasGpsPermission 
                      ? '#F59E0B' 
                      : '#EF4444' 
                  }
                ]} 
              />
              <Text style={styles.gpsText}>
                {tracker.isGpsAcquired 
                  ? 'GPS ATIVO' 
                  : tracker.hasGpsPermission 
                  ? 'BUSCANDO SINAL...' 
                  : 'SEM GPS'}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={handleRecenter} 
              style={styles.recenterButton} 
              activeOpacity={0.8}
              accessibilityLabel="Centralizar no GPS"
            >
              <LocateFixed size={18} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        {/* GPS Satellite Search Banner */}
        {!tracker.isGpsAcquired && (
          <View style={styles.connectingGpsBanner}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.connectingGpsText}>
              Localizando satélites GPS... Centralizando mapa
            </Text>
          </View>
        )}

        {/* Temporary Notice or Paused Banner */}
        {tracker.autoNotice && (
          <View style={styles.noticeBanner}>
            <AlertCircle size={15} color="#0284C7" strokeWidth={2.2} />
            <Text style={styles.noticeBannerText}>{tracker.autoNotice}</Text>
          </View>
        )}

        {isPaused && (
          <View style={styles.pausedBadge}>
            <Text style={styles.pausedBadgeText}>
              {tracker.pauseReason === 'auto' ? 'PAUSA AUTOMÁTICA' : 'CORRIDA EM PAUSA'}
            </Text>
          </View>
        )}

        {/* Floating Distance Hero Card (Dark Glassmorphism) */}
        <View style={styles.floatingDistanceCard}>
          <Text style={styles.distanceValue}>{tracker.distanceKm.toFixed(2)}</Text>
          <Text style={styles.distanceUnit}>QUILÔMETROS</Text>
        </View>

        {/* Bottom Floating Control Dock */}
        <View style={styles.bottomDock}>
          {/* Secondary Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <Clock size={12} color="#94A3B8" />
                <Text style={styles.metricLabel}>TEMPO</Text>
              </View>
              <Text style={styles.metricValue}>
                {formatDuration(tracker.movingSeconds)}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <Zap size={12} color="#38BDF8" />
                <Text style={styles.metricLabel}>RITMO</Text>
              </View>
              <Text style={styles.metricValue}>
                {tracker.averagePace}
              </Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricLabelRow}>
                <Gauge size={12} color="#F97316" />
                <Text style={styles.metricLabel}>VELOCIDADE</Text>
              </View>
              <Text style={styles.metricValue}>
                {tracker.currentSpeedKmh > 0 ? `${tracker.currentSpeedKmh.toFixed(1)} km/h` : '0.0 km/h'}
              </Text>
            </View>
          </View>

          {/* Action Control Buttons (Circular Play/Pause & Flag) */}
          <View style={styles.controlsSection}>
            {isPaused ? (
              <TouchableOpacity
                onPress={tracker.resumeManual}
                style={[styles.circleButton, styles.resumeButton]}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Retomar Corrida"
              >
                <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={tracker.pauseManual}
                style={[styles.circleButton, styles.pauseButton]}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Pausar Corrida"
              >
                <Pause size={28} color="#0F172A" fill="#0F172A" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleFinishPress}
              style={[styles.circleButton, styles.finishButton]}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Finalizar Corrida"
            >
              <Flag size={24} color="#FFFFFF" strokeWidth={2.6} />
            </TouchableOpacity>
          </View>

          <Text style={styles.controlHintText}>
            {isPaused ? 'Toque no botão para retomar o percurso' : 'Toque no botão amarelo para pausar ou na bandeira para concluir'}
          </Text>
        </View>
      </SafeAreaView>

      {/* Confirmation Finish Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        distanceKm={tracker.distanceKm}
        onConfirm={handleConfirmFinish}
        onCancel={() => setShowConfirmModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  overlayContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  // Map Markers
  startMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  challengePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: '55%',
  },
  challengePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  gpsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  recenterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Notices
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: '#38BDF8',
    alignSelf: 'center',
  },
  noticeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  pausedBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    alignSelf: 'center',
  },
  pausedBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },

  // Hero Distance Display (Floating Glassmorphism)
  floatingDistanceCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: theme.radius.xl,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  distanceValue: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 58,
  },
  distanceUnit: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 2,
    marginTop: 2,
  },

  // Bottom Floating Dock
  bottomDock: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Circular Control Buttons
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 4,
  },
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pauseButton: {
    backgroundColor: '#FACC15', // Energy yellow
  },
  resumeButton: {
    backgroundColor: '#10B981', // Go green
  },
  finishButton: {
    backgroundColor: '#EF4444', // Red flag
  },
  controlHintText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },

  // Runner Marker (Live pulsating blue dot)
  runnerMarkerOuter: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerMarkerPulse: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
  },
  runnerMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0284C7',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },

  // GPS Satellite Acquisition Banner
  connectingGpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignSelf: 'center',
  },
  connectingGpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // Web Map Fallback
  webMapFallback: {
    backgroundColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webMapFallbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  webMapFallbackCoords: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 8,
  },
  webMapFallbackSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
  },
});
