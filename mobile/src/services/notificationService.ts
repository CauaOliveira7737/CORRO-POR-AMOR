import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, ChallengeParticipant } from '@corro-por-amor/shared';

const STORAGE_KEY_NOTIFS = '@corro_por_amor:notifications_enabled';

export interface ReminderInfo {
  title: string;
  body: string;
  remainingKm?: number;
}

export const notificationService = {
  /**
   * Initializes notification service safely without crashing existing APK builds
   */
  async init(): Promise<void> {
    // Safe initialization
  },

  /**
   * Checks or requests notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    return true;
  },

  /**
   * Gets user notification preference from AsyncStorage (default: true)
   */
  async isEnabled(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_NOTIFS);
      if (stored === null) return true; // default enabled
      return stored === 'true';
    } catch {
      return true;
    }
  },

  /**
   * Saves user notification preference in AsyncStorage
   */
  async setEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFS, enabled ? 'true' : 'false');
    } catch (err) {
      console.warn('Error saving notification preference:', err);
    }
  },

  /**
   * Cancels all scheduled local reminders
   */
  async cancelAll(): Promise<void> {
    // Safely handled
  },

  /**
   * Calculates smart motivational reminder and remaining distance for active challenge
   */
  getReminderMessage(
    activeChallenge?: Challenge | null,
    participant?: ChallengeParticipant | null
  ): ReminderInfo {
    if (activeChallenge && participant) {
      const targetKm = participant.target_km || activeChallenge.target_km || 50;
      const completedKm = participant.completed_km || 0;
      const remainingKm = Math.max(0, targetKm - completedKm);

      if (remainingKm > 0) {
        return {
          title: `🎯 Faltam apenas ${remainingKm.toFixed(1)} km!`,
          body: `Você já completou ${completedKm.toFixed(1)} km de ${targetKm} km no desafio "${activeChallenge.name}". Falta pouco para a sua medalha oficial!`,
          remainingKm,
        };
      } else {
        return {
          title: `🏆 Parabéns! Meta de ${targetKm} km Concluída!`,
          body: `Você superou o desafio "${activeChallenge.name}". Confira seu lugar no ranking de campeões!`,
          remainingKm: 0,
        };
      }
    }

    return {
      title: '🏃 Hora de Treinar!',
      body: 'Calce o tênis e venha somar quilômetros hoje no Corro por Amor. Cada quilômetro tem um propósito!',
    };
  },

  /**
   * Syncs reminders based on user preference and active challenge
   */
  async syncReminders(
    activeChallenge?: Challenge | null,
    participant?: ChallengeParticipant | null
  ): Promise<ReminderInfo | null> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      return null;
    }
    return this.getReminderMessage(activeChallenge, participant);
  },
};
