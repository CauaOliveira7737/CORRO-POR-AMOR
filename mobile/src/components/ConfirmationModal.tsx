import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Flag, Play } from 'lucide-react-native';
import { theme } from '../theme';

interface ConfirmationModalProps {
  visible: boolean;
  distanceKm: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  distanceKm,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconCircle}>
            <Flag size={28} color={theme.colors.brandBlue} strokeWidth={2} />
          </View>

          <Text style={styles.title}>FINALIZAR CORRIDA?</Text>
          <Text style={styles.subtitle}>
            Você percorreu <Text style={styles.distanceHighlight}>{distanceKm.toFixed(2)} km</Text>.
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.cancelButton}
              activeOpacity={0.8}
            >
              <Play size={16} color={theme.colors.brandBlue} strokeWidth={2} />
              <Text style={styles.cancelText}>CONTINUAR CORRENDO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={styles.confirmButton}
              activeOpacity={0.8}
            >
              <Flag size={16} color={theme.colors.white} strokeWidth={2} />
              <Text style={styles.confirmText}>FINALIZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(1, 42, 74, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(1, 79, 134, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: 0.02,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  distanceHighlight: {
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.brandBlue,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.brandBlue,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.brandBlue,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
