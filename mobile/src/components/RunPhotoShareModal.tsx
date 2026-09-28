import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import Svg, { Path } from 'react-native-svg';
import { 
  Camera, 
  Image as ImageIcon, 
  Share2, 
  X, 
  Check, 
  Sparkles,
  Sliders,
  Maximize2,
  Square,
  Smartphone
} from 'lucide-react-native';
import { theme } from '../theme';
import { RunPoint } from '@corro-por-amor/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RunPhotoShareModalProps {
  visible: boolean;
  distanceKm: number;
  movingSeconds: number;
  averagePace: string;
  calories?: number;
  routeCoordinates?: RunPoint[];
  initialPhotoUri?: string | null;
  onSavePhoto?: (photoUri: string) => Promise<void>;
  onClose: () => void;
}

export const RunPhotoShareModal: React.FC<RunPhotoShareModalProps> = ({
  visible,
  distanceKm,
  movingSeconds,
  averagePace,
  calories,
  routeCoordinates = [],
  initialPhotoUri = null,
  onSavePhoto,
  onClose,
}) => {
  const [photoUri, setPhotoUri] = useState<string | null>(initialPhotoUri);
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggles for visible metrics
  const [showDistance, setShowDistance] = useState(true);
  const [showPace, setShowPace] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showRoute, setShowRoute] = useState(true);

  const viewShotRef = useRef<any>(null);

  // Pick photo from gallery
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para criar o card.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectRatio === 'story' ? [9, 16] : [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('Erro ao abrir galeria:', err);
      Alert.alert('Erro', 'Não foi possível carregar a imagem selecionada.');
    }
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua câmera para tirar a foto da corrida.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio === 'story' ? [9, 16] : [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('Erro ao abrir câmera:', err);
      Alert.alert('Erro', 'Não foi possível capturar a foto.');
    }
  };

  // Share photo using native share sheet
  const handleShareCard = async () => {
    if (!viewShotRef.current) return;
    setIsCapturing(true);

    try {
      const uri = await (viewShotRef.current as any).capture();
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Compartilhamento indisponível', 'O compartilhamento nativo não está disponível neste dispositivo.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Compartilhe seu treino Corro por Amor',
        UTI: 'public.jpeg',
      });
    } catch (err: any) {
      console.error('Erro ao compartilhar card:', err);
      Alert.alert('Erro ao compartilhar', 'Houve um erro ao processar o card para compartilhamento.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Save photo to activity in app / backend
  const handleSaveToActivity = async () => {
    if (!photoUri || !onSavePhoto) return;
    setIsSaving(true);
    try {
      await onSavePhoto(photoUri);
      Alert.alert('Foto Salva!', 'Sua foto foi vinculada à corrida com sucesso.');
    } catch (err: any) {
      console.error('Erro ao salvar foto:', err);
      Alert.alert('Aviso', 'A foto foi mantida no seu celular.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format time (e.g. 53min 23s or 1h 12min)
  const formatTimeDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}min`;
    }
    return `${mins}min ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Generate SVG path from actual GPS coordinates (normalized to 120x40 box)
  const generateRouteSvgPath = () => {
    if (!routeCoordinates || routeCoordinates.length < 2) {
      // Default sleek runner elevation contour line if points are few
      return 'M 5 28 Q 30 10, 60 22 T 115 12';
    }

    const lats = routeCoordinates.map((c) => c.latitude);
    const lons = routeCoordinates.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latDelta = maxLat - minLat || 0.0001;
    const lonDelta = maxLon - minLon || 0.0001;

    const width = 110;
    const height = 36;
    const padding = 6;

    const points = routeCoordinates.map((c) => {
      const x = padding + ((c.longitude - minLon) / lonDelta) * (width - padding * 2);
      const y = height - padding - ((c.latitude - minLat) / latDelta) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  };

  // Default fallback runner demonstration photo if user hasn't selected yet
  const displayImageUri = photoUri || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1080&q=80';

  const cardWidth = Math.min(SCREEN_WIDTH - 48, 340);
  const cardHeight = aspectRatio === 'story' ? cardWidth * (16 / 9) : cardWidth;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* Top Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Card de Compartilhamento</Text>
              <Text style={styles.modalSubtitle}>Personalize sua foto com métricas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={20} color={theme.colors.primaryDark} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Format Selector Pills (Story 9:16 vs Feed 1:1) */}
            <View style={styles.formatRow}>
              <TouchableOpacity
                onPress={() => setAspectRatio('story')}
                style={[styles.formatPill, aspectRatio === 'story' && styles.formatPillActive]}
                activeOpacity={0.8}
              >
                <Smartphone size={15} color={aspectRatio === 'story' ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[styles.formatText, aspectRatio === 'story' && styles.formatTextActive]}>
                  Story (9:16)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAspectRatio('square')}
                style={[styles.formatPill, aspectRatio === 'square' && styles.formatPillActive]}
                activeOpacity={0.8}
              >
                <Square size={15} color={aspectRatio === 'square' ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[styles.formatText, aspectRatio === 'square' && styles.formatTextActive]}>
                  Feed (1:1)
                </Text>
              </TouchableOpacity>
            </View>

            {/* The Strava-style Share Card Preview */}
            <View style={styles.previewWrapper}>
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'jpg', quality: 0.95 }}
                style={[
                  styles.cardShotContainer,
                  { width: cardWidth, height: cardHeight }
                ]}
              >
                {/* Background Photo */}
                <Image
                  source={{ uri: displayImageUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />

                {/* Left Gradient / Dark Shade Overlay so white text is 100% readable */}
                <View style={styles.overlayShade} />

                {/* Content Overlay */}
                <View style={styles.cardContent}>
                  {/* Top Branding (Corro Por Amor) */}
                  <View style={styles.brandHeader}>
                    <Text style={styles.brandTitle}>CORRO POR AMOR</Text>
                    <View style={styles.brandBar} />
                  </View>

                  {/* Vertical Metric Display (Authentic Strava Layout from User Photo) */}
                  <View style={styles.metricsColumn}>
                    {showDistance && (
                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>Distância</Text>
                        <Text style={styles.metricValue}>
                          {distanceKm.toFixed(2).replace('.', ',')} km
                        </Text>
                      </View>
                    )}

                    {showPace && (
                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>Ritmo</Text>
                        <Text style={styles.metricValue}>
                          {averagePace.replace(' /km', '')} /km
                        </Text>
                      </View>
                    )}

                    {showTime && (
                      <View style={styles.metricBlock}>
                        <Text style={styles.metricLabel}>Tempo</Text>
                        <Text style={styles.metricValue}>
                          {formatTimeDisplay(movingSeconds)}
                        </Text>
                      </View>
                    )}

                    {/* GPS Route Sparkline Line */}
                    {showRoute && (
                      <View style={styles.routeContainer}>
                        <Svg width={120} height={40}>
                          <Path
                            d={generateRouteSvgPath()}
                            fill="none"
                            stroke="#FF5500"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    )}
                  </View>
                </View>
              </ViewShot>
            </View>

            {/* Photo Action Buttons */}
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={styles.photoButton}
                activeOpacity={0.8}
              >
                <Camera size={16} color={theme.colors.brandBlue} strokeWidth={2.2} />
                <Text style={styles.photoButtonText}>Tirar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={styles.photoButton}
                activeOpacity={0.8}
              >
                <ImageIcon size={16} color={theme.colors.brandBlue} strokeWidth={2.2} />
                <Text style={styles.photoButtonText}>Escolher Galeria</Text>
              </TouchableOpacity>
            </View>

            {/* Metric Customization Toggles */}
            <View style={styles.togglesSection}>
              <Text style={styles.togglesSectionTitle}>EXIBIR NO CARD</Text>
              <View style={styles.togglesRow}>
                <TouchableOpacity
                  onPress={() => setShowDistance(!showDistance)}
                  style={[styles.toggleChip, showDistance && styles.toggleChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleChipText, showDistance && styles.toggleChipTextActive]}>
                    Distância {showDistance ? '✓' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowPace(!showPace)}
                  style={[styles.toggleChip, showPace && styles.toggleChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleChipText, showPace && styles.toggleChipTextActive]}>
                    Ritmo {showPace ? '✓' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTime(!showTime)}
                  style={[styles.toggleChip, showTime && styles.toggleChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleChipText, showTime && styles.toggleChipTextActive]}>
                    Tempo {showTime ? '✓' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowRoute(!showRoute)}
                  style={[styles.toggleChip, showRoute && styles.toggleChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleChipText, showRoute && styles.toggleChipTextActive]}>
                    Traçado GPS {showRoute ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Action Buttons */}
            <View style={styles.bottomButtonsContainer}>
              <TouchableOpacity
                onPress={handleShareCard}
                disabled={isCapturing}
                style={styles.primaryShareButton}
                activeOpacity={0.88}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Share2 size={20} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.primaryShareButtonText}>COMPARTILHAR FOTO</Text>
                  </>
                )}
              </TouchableOpacity>

              {photoUri && onSavePhoto && (
                <TouchableOpacity
                  onPress={handleSaveToActivity}
                  disabled={isSaving}
                  style={styles.savePhotoButton}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator color={theme.colors.brandBlue} size="small" />
                  ) : (
                    <>
                      <Check size={18} color={theme.colors.brandBlue} strokeWidth={2.4} />
                      <Text style={styles.savePhotoButtonText}>Salvar Foto no Histórico</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 16,
  },

  // Format Pills
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  formatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formatPillActive: {
    backgroundColor: theme.colors.brandBlue,
    borderColor: theme.colors.brandBlue,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  formatTextActive: {
    color: '#FFFFFF',
  },

  // Card Preview Area
  previewWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#0F172A',
  },
  cardShotContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  overlayShade: {
    ...StyleSheet.absoluteFill,
    // Radial/left soft shadow gradient effect
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },

  // Branding Top Left
  brandHeader: {
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  brandBar: {
    width: 38,
    height: 4,
    backgroundColor: '#FF5500',
    borderRadius: 2,
    marginTop: 6,
  },

  // Vertical Metrics (Identical to Strava style reference)
  metricsColumn: {
    gap: 18,
  },
  metricBlock: {
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.82)',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  routeContainer: {
    marginTop: 8,
  },

  // Photo Action Buttons
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(1, 79, 134, 0.2)',
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brandBlue,
  },

  // Toggles
  togglesSection: {
    width: '100%',
    gap: 8,
  },
  togglesSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  togglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleChipActive: {
    backgroundColor: 'rgba(1, 79, 134, 0.1)',
    borderColor: theme.colors.brandBlue,
  },
  toggleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleChipTextActive: {
    color: theme.colors.brandBlue,
    fontWeight: '800',
  },

  // Bottom Buttons
  bottomButtonsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  primaryShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF5500',
    paddingVertical: 15,
    borderRadius: theme.radius.lg,
    ...theme.shadows.card,
  },
  primaryShareButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  savePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  savePhotoButtonText: {
    color: theme.colors.brandBlue,
    fontSize: 13,
    fontWeight: '800',
  },
});
