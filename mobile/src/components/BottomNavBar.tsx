import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Trophy, Activity, BarChart2, User } from 'lucide-react-native';
import { theme } from '../theme';

export type MobileTab = 'home' | 'challenges' | 'activity' | 'ranking' | 'profile';

interface BottomNavBarProps {
  currentTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  // Dynamically calculate bottom offset so it floats safely above Android 3-button bar or iOS home bar
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10) + 8;

  const tabs = [
    { id: 'home' as MobileTab, label: 'Início', icon: Home },
    { id: 'challenges' as MobileTab, label: 'Desafios', icon: Trophy },
    { id: 'activity' as MobileTab, label: 'Treinar', icon: Activity, isCenter: true },
    { id: 'ranking' as MobileTab, label: 'Ranking', icon: BarChart2 },
    { id: 'profile' as MobileTab, label: 'Perfil', icon: User },
  ];

  return (
    <View style={[styles.wrapper, { bottom: safeBottom }]} pointerEvents="box-none">
      <View style={styles.dock}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = currentTab === tab.id;

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onSelectTab(tab.id)}
                style={styles.centerTabButton}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={tab.label}
              >
                <View style={[styles.centerIconContainer, isSelected && styles.centerIconContainerActive]}>
                  <Icon
                    size={24}
                    color={theme.colors.white}
                    strokeWidth={2.8}
                  />
                </View>
                <Text style={[styles.centerTabLabel, isSelected && styles.centerTabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabButton}
              activeOpacity={0.75}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconContainer, isSelected && styles.iconContainerActive]}>
                <Icon
                  size={20}
                  color={isSelected ? theme.colors.white : '#8E9BAE'}
                  strokeWidth={isSelected ? 2.4 : 1.8}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isSelected ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 999,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dockBackground,
    borderRadius: 36,
    paddingVertical: 8,
    paddingHorizontal: 10,
    width: '100%',
    maxWidth: 440,
    ...theme.shadows.floating,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: theme.colors.dockActive,
    shadowColor: theme.colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#8E9BAE',
  },

  // Elevated Center Button
  centerTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  centerIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.accentEnergy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: theme.colors.dockBackground,
    shadowColor: theme.colors.accentEnergy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 2,
  },
  centerIconContainerActive: {
    backgroundColor: '#E64A19',
    transform: [{ scale: 1.05 }],
  },
  centerTabLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FED7AA',
    letterSpacing: -0.1,
  },
  centerTabLabelActive: {
    color: theme.colors.white,
  },
});
