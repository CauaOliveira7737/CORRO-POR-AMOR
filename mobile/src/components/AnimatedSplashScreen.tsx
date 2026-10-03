import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '../theme';

// Instruct native splash screen to stay visible until our animated splash takes over
SplashScreen.preventAutoHideAsync().catch(() => {});

interface AnimatedSplashScreenProps {
  isReady: boolean;
  onAnimationFinished?: () => void;
  children: any;
}

const { width } = Dimensions.get('window');

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  isReady,
  onAnimationFinished,
  children,
}) => {
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);

  // Animation values
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Hide native splash screen as soon as React Native mounts this custom component
    SplashScreen.hideAsync().catch(() => {});

    // 2. Initial Entrance Animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
    ]).start();

    // 3. Continuous gentle pulse while loading
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  // When app data is ready, ensure a minimal display time and smoothly transition out
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }).start(() => {
          setSplashAnimationDone(true);
          if (onAnimationFinished) onAnimationFinished();
        });
      }, 700); // 700ms buffer ensures smooth and visible branding entrance

      return () => clearTimeout(timer);
    }
  }, [isReady]);

  return (
    <View style={styles.root}>
      {/* Underlying Main Application */}
      {children}

      {/* Animated Overlay Splash Screen */}
      {!splashAnimationDone && (
        <Animated.View
          style={[
            styles.splashContainer,
            {
              opacity: containerOpacity,
            },
          ]}
          pointerEvents="none"
        >
          {/* Subtle Ambient Decorative Circles */}
          <View style={styles.ambientCircleLarge} />
          <View style={styles.ambientCircleSmall} />

          {/* Branded Content Container */}
          <View style={styles.contentWrap}>
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: logoOpacity,
                  transform: [
                    { scale: Animated.multiply(logoScale, pulseScale) },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
              <Text style={styles.tagline}>CADA QUILÔMETRO TEM UM PROPÓSITO</Text>
            </Animated.View>

            {/* Custom Modern Loading Indicator */}
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['15%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.palette.blue1,
  },
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.palette.blue1, // Official Deep Navy #012A4A
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  ambientCircleLarge: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.colors.palette.blue2,
    opacity: 0.35,
  },
  ambientCircleSmall: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: theme.colors.palette.blue3,
    opacity: 0.25,
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: width * 0.65,
    maxWidth: 270,
    height: 100,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.palette.blue9,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  progressBarTrack: {
    width: 140,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accentEnergy, // #FF5722
    borderRadius: 2,
  },
});
