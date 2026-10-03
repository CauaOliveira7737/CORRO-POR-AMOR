import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Modal, TextInput, ActivityIndicator, Image, StatusBar, Platform } from 'react-native';
import { 
  User, 
  Flame, 
  Award, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  LogOut, 
  Bell, 
  Shield, 
  Download, 
  HelpCircle,
  Smartphone,
  Share2,
  Lock,
  Edit3,
  X,
  Check,
  Sparkles
} from 'lucide-react-native';
import { theme } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { Profile, Achievement, AthleteAchievement, ChallengeParticipant, APP_CONFIG } from '@corro-por-amor/shared';

interface ProfileScreenProps {
  profile: Profile | null;
  achievements: Achievement[];
  userAchievements: AthleteAchievement[];
  participants: ChallengeParticipant[];
  onSignOut?: () => void;
  onUpdateProfile?: (updates: Partial<Profile>) => Promise<void>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  achievements,
  userAchievements,
  participants,
  onSignOut,
  onUpdateProfile,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  const currentLevel = profile?.level || 1;
  const currentXp = profile?.xp_total || 0;
  const nextLevelXp = APP_CONFIG.gamification.xpForNextLevel(currentLevel);
  const prevLevelXp = currentLevel > 1 ? APP_CONFIG.gamification.xpForNextLevel(currentLevel - 1) : 0;
  
  const levelProgress = Math.max(0, Math.min(100, ((currentXp - prevLevelXp) / Math.max(1, nextLevelXp - prevLevelXp)) * 100));
  const xpNeeded = Math.max(0, nextLevelXp - currentXp);

  const unlockedMap = new Set(userAchievements.map((ua) => ua.achievement_id));

  const myCompletedChallenges = participants.filter((p) => p.athlete_id === profile?.id && p.completion_percentage >= 100);
  const firstPlacesCount = participants.filter((p) => p.athlete_id === profile?.id && p.is_first_to_finish).length;

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Atenção', 'O nome não pode ficar em branco.');
      return;
    }
    if (!onUpdateProfile) return;

    setSaving(true);
    try {
      await onUpdateProfile({ name: editName.trim() });
      setShowEditModal(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.palette.blue1} />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Immersive Deep Navy Curved Hero Header */}
        <View style={styles.heroHeader}>
          {/* Subtle Decorative Geometric Circles */}
          <View style={styles.decorCircleTopRight} />
          <View style={styles.decorCircleBottomLeft} />

          <View style={styles.tagPill}>
            <Sparkles size={11} color={theme.colors.palette.blue9} strokeWidth={2.4} />
            <Text style={styles.tagPillText}>PERFIL DO ATLETA • RUNNING CLUB</Text>
          </View>

          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
            <View style={styles.levelPillBadge}>
              <Text style={styles.levelPillText}>LVL {currentLevel}</Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile?.name || 'Atleta'}</Text>
            <TouchableOpacity 
              onPress={() => {
                setEditName(profile?.name || '');
                setShowEditModal(true);
              }}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <Edit3 size={15} color={theme.colors.palette.blue9} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.email}>{profile?.email || ''}</Text>

          <View style={styles.xpRow}>
            <View style={styles.xpPill}>
              <Flame size={14} color="#FF5722" strokeWidth={2.4} />
              <Text style={styles.xpPillText}>{currentXp.toLocaleString('pt-BR')} XP TOTAL</Text>
            </View>
          </View>

          {/* Level Progression Progress Bar */}
          <View style={styles.levelProgressBox}>
            <View style={styles.levelProgressHeader}>
              <Text style={styles.levelProgressTitle}>Evolução para o Nível {currentLevel + 1}</Text>
              <Text style={styles.levelProgressXp}>{xpNeeded} XP restantes</Text>
            </View>
            <ProgressBar percentage={levelProgress} height={8} showLabel={false} />
          </View>
        </View>

        {/* 2. Curved White Content Sheet */}
        <View style={styles.curvedContentSheet}>

      {/* 2. Lifetime Stats Grid (Reference 3 Stat Pills) */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {(profile?.total_distance_km || 0).toFixed(1)}
          </Text>
          <Text style={styles.statUnit}>KM</Text>
          <Text style={styles.statCaption}>Total Percorrido</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {myCompletedChallenges.length}
          </Text>
          <Text style={styles.statUnit}>DESAFIOS</Text>
          <Text style={styles.statCaption}>Concluídos</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {firstPlacesCount}
          </Text>
          <Text style={styles.statUnit}>VITÓRIAS</Text>
          <Text style={styles.statCaption}>1º Lugar</Text>
        </View>
      </View>

      {/* 3. Settings & Preferences Menu Card (Reference Screen 2 Settings List) */}
      <View style={styles.menuGroupCard}>
        <Text style={styles.menuGroupTitle}>PREFERÊNCIAS & CONTA</Text>

        {/* Notifications */}
        <View style={styles.menuItem}>
          <View style={[styles.menuIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Bell size={18} color="#0284C7" strokeWidth={2.2} />
          </View>
          <View style={styles.menuItemTextWrap}>
            <Text style={styles.menuItemTitle}>Notificações de Treino</Text>
            <Text style={styles.menuItemSubtitle}>Lembretes diários e alertas de ranking</Text>
          </View>
          <Switch 
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#CBD5E1', true: theme.colors.brandBlue }}
            thumbColor={theme.colors.white}
          />
        </View>

        {/* Connected Devices */}
        <TouchableOpacity 
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Dispositivos Conectados', 'Seu aplicativo utiliza rastreamento GPS de alta precisão nativo do seu smartphone.')}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Smartphone size={18} color="#D97706" strokeWidth={2.2} />
          </View>
          <View style={styles.menuItemTextWrap}>
            <Text style={styles.menuItemTitle}>Dispositivos & Sensores</Text>
            <Text style={styles.menuItemSubtitle}>GPS de Alta Precisão ativo</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMutedSoft} />
        </TouchableOpacity>

        {/* Privacy & Anti-fraud */}
        <TouchableOpacity 
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Segurança e Telemetria', 'O motor físico anti-fraude analisa ritmo, paradas e acelerações para garantir a justiça no ranking.')}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Shield size={18} color="#059669" strokeWidth={2.2} />
          </View>
          <View style={styles.menuItemTextWrap}>
            <Text style={styles.menuItemTitle}>Segurança & Validação</Text>
            <Text style={styles.menuItemSubtitle}>Algoritmo de telemetria ativo</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMutedSoft} />
        </TouchableOpacity>

        {/* Support & Feedback */}
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomWidth: 0 }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Suporte', 'Precisa de ajuda com medalhas ou desafios? Envie um e-mail para suporte@corroporamor.com')}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#F1F5F9' }]}>
            <HelpCircle size={18} color={theme.colors.primaryDark} strokeWidth={2.2} />
          </View>
          <View style={styles.menuItemTextWrap}>
            <Text style={styles.menuItemTitle}>Ajuda & Regulamento</Text>
            <Text style={styles.menuItemSubtitle}>Dúvidas sobre medalhas e regras</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.textMutedSoft} />
        </TouchableOpacity>
      </View>

      {/* 4. Achievements Showcase */}
      {achievements.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CONQUISTAS DO ATLETA</Text>
            <Text style={styles.sectionCount}>
              {userAchievements.length} de {achievements.length}
            </Text>
          </View>

          <View style={styles.achievementsList}>
            {achievements.map((ach) => {
              const isUnlocked = unlockedMap.has(ach.id);

              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementItem,
                    !isUnlocked && styles.achievementItemLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIconCircle,
                      isUnlocked
                        ? styles.achievementIconUnlocked
                        : styles.achievementIconLockedCircle,
                    ]}
                  >
                    <Award
                      size={20}
                      color={isUnlocked ? '#FFFFFF' : theme.colors.textMutedSoft}
                      strokeWidth={2.2}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={[
                          styles.achievementTitle,
                          !isUnlocked && styles.achievementTitleLocked,
                        ]}
                      >
                        {ach.title}
                      </Text>
                      {isUnlocked && (
                        <CheckCircle2 size={13} color={theme.colors.accentGreen} />
                      )}
                    </View>
                    <Text style={styles.achievementDescription}>
                      {ach.description}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.achievementXp,
                      isUnlocked && { color: theme.colors.brandBlue },
                    ]}
                  >
                    +{ach.xp_reward} XP
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. Sign Out Button */}
      {onSignOut && (
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Sair da Conta',
              'Deseja realmente desconectar do aplicativo?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: onSignOut },
              ]
            );
          }} 
          style={styles.signOutButton}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#DC2626" strokeWidth={2.2} />
          <Text style={styles.signOutText}>Sair da Conta</Text>
        </TouchableOpacity>
      )}

      {/* Brand Footer Seal */}
      <View style={styles.footerBrand}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.footerBrandLogo}
          resizeMode="contain"
        />
        <Text style={styles.footerBrandText}>Equipe Corro por Amor • v1.0.0</Text>
      </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeButton}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NOME DO ATLETA</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Seu nome completo"
                placeholderTextColor={theme.colors.textMutedSoft}
                style={styles.textInput}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.cancelModalButton}
                disabled={saving}
              >
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSaveProfile}
                style={styles.saveModalButton}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text style={styles.saveModalText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.palette.blue1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: theme.colors.palette.blue1,
  },

  // 1. Immersive Deep Navy Curved Hero Header
  heroHeader: {
    backgroundColor: theme.colors.palette.blue1,
    paddingTop: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircleTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.palette.blue2,
    opacity: 0.5,
  },
  decorCircleBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.palette.blue9,
    letterSpacing: 0.8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.palette.blue2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.palette.blue9,
  },
  avatarInitial: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  levelPillBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: theme.colors.accentEnergy,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: theme.colors.palette.blue1,
  },
  levelPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: -0.3,
  },
  editButton: {
    padding: 6,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  email: {
    fontSize: 13,
    color: theme.colors.palette.blue9,
    marginTop: 2,
  },
  xpRow: {
    marginTop: 10,
    marginBottom: 14,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 34, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  xpPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF8A65',
    letterSpacing: 0.5,
  },
  levelProgressBox: {
    width: '100%',
    backgroundColor: 'rgba(1, 42, 74, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(137, 194, 217, 0.2)',
    padding: 14,
    borderRadius: theme.radius.lg,
    gap: 8,
  },
  levelProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelProgressTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.white,
  },
  levelProgressXp: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.palette.blue9,
  },

  // 2. Curved Content Sheet
  curvedContentSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 135,
    gap: 18,
    minHeight: 500,
  },

  // 2. Stats Grid
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: 14,
    alignItems: 'center',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primaryDark,
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.brandBlue,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // 3. Settings Menu
  menuGroupCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 18,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 4,
  },
  menuGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },

  // 4. Achievements
  sectionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.xl,
    padding: 18,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.brandBlue,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.subtleGray,
  },
  achievementItemLocked: {
    opacity: 0.55,
  },
  achievementIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: theme.colors.brandBlue,
  },
  achievementIconLockedCircle: {
    backgroundColor: '#E2E8F0',
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  achievementTitleLocked: {
    color: theme.colors.textSecondary,
  },
  achievementDescription: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  achievementXp: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },

  // 5. Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.xl,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 6,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primaryDark,
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: theme.colors.subtleGray,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  saveModalButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    minWidth: 120,
    alignItems: 'center',
  },
  saveModalText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.white,
  },
  footerBrand: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 20,
    gap: 8,
  },
  footerBrandLogo: {
    width: 64,
    height: 44,
    tintColor: theme.colors.palette.blue1,
    opacity: 0.85,
  },
  footerBrandText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMutedSoft,
    letterSpacing: 0.5,
  },
});
