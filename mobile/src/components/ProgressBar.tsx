import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface ProgressBarProps {
  percentage: number;
  height?: number;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  height = 12,
  showLabel = true,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const isDone = clamped >= 100;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${clamped}%`, 
              height,
              backgroundColor: isDone ? theme.colors.success : theme.colors.brandBlue,
            }
          ]} 
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: isDone ? theme.colors.success : theme.colors.brandBlue }]}>
          {Math.round(clamped)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  track: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: theme.radius.full,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'right',
  },
});
