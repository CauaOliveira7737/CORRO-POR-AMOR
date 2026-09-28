import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { 
  RunPoint, 
  RunStatus, 
  PauseReason, 
  calculateHaversineDistance, 
  calculateAveragePace,
  APP_CONFIG
} from '@corro-por-amor/shared';

export interface RunTrackerState {
  status: RunStatus;
  pauseReason: PauseReason | null;
  distanceKm: number;
  movingSeconds: number;
  pausedSeconds: number;
  averagePace: string;
  currentSpeedKmh: number;
  routePoints: RunPoint[];
  currentLocation: RunPoint | null;
  isGpsAcquired: boolean;
  autoNotice: string | null;
  hasGpsPermission: boolean;
  gpsError: string | null;
}

export function useRunTracker() {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [movingSeconds, setMovingSeconds] = useState<number>(0);
  const [pausedSeconds, setPausedSeconds] = useState<number>(0);
  const [averagePace, setAveragePace] = useState<string>('--:-- /km');
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [routePoints, setRoutePoints] = useState<RunPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<RunPoint | null>(null);
  const [isGpsAcquired, setIsGpsAcquired] = useState<boolean>(false);
  const [autoNotice, setAutoNotice] = useState<string | null>(null);
  const [hasGpsPermission, setHasGpsPermission] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastPointRef = useRef<RunPoint | null>(null);
  const stoppedSinceRef = useRef<number | null>(null);
  const movingConsecutiveSamplesRef = useRef<number>(0);
  const noticeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fetch last known position if permissions exist
  useEffect(() => {
    Location.getForegroundPermissionsAsync().then((res) => {
      if (res.granted) {
        setHasGpsPermission(true);
        Location.getLastKnownPositionAsync().then((pos) => {
          if (pos?.coords) {
            setCurrentLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed || 0,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  // Show a temporary banner notice (e.g. "Corrida pausada automaticamente", "▶ Corrida retomada")
  const showNotice = (message: string, durationMs: number = 4000) => {
    setAutoNotice(message);
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = setTimeout(() => {
      setAutoNotice(null);
    }, durationMs);
  };

  // Request permissions
  const requestPermissions = async () => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setGpsError('Permissão de GPS em primeiro plano não autorizada.');
        setHasGpsPermission(false);
        return false;
      }
      setHasGpsPermission(true);
      setGpsError(null);
      return true;
    } catch (err: any) {
      setGpsError('Erro ao solicitar permissão de GPS: ' + err.message);
      return false;
    }
  };

  // Timers: increments movingSeconds when running, pausedSeconds when paused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === 'running') {
      interval = setInterval(() => {
        setMovingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (status === 'paused') {
      interval = setInterval(() => {
        setPausedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Update average pace whenever movingSeconds or distanceKm change
  useEffect(() => {
    setAveragePace(calculateAveragePace(movingSeconds, distanceKm));
  }, [movingSeconds, distanceKm]);

  // Process incoming GPS coordinate
  const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
    const { latitude, longitude, altitude, accuracy, speed } = location.coords;
    const timestamp = location.timestamp;

    const currentSpeedMs = speed && speed > 0 ? speed : 0;
    const speedKmh = Number((currentSpeedMs * 3.6).toFixed(1));
    setCurrentSpeedKmh(speedKmh);

    const newPoint: RunPoint = {
      latitude,
      longitude,
      altitude,
      speed: currentSpeedMs,
      accuracy,
      timestamp,
    };

    // Always update current position for the map and flag GPS as acquired
    setCurrentLocation(newPoint);
    setIsGpsAcquired(true);

    // Filter points with poor horizontal accuracy for route tracking & distance accumulation
    if (accuracy && accuracy > APP_CONFIG.gps.maxAccuracyMeters) {
      return;
    }

    // If currently RUNNING:
    if (status === 'running') {
      // 1. Accumulate distance if previous point exists
      if (lastPointRef.current) {
        const segKm = calculateHaversineDistance(
          lastPointRef.current.latitude,
          lastPointRef.current.longitude,
          latitude,
          longitude
        );
        // Sanity check on segment distance (ignore absurd teleport jumps > 500m in 1-2s)
        if (segKm < 0.5) {
          setDistanceKm((prev) => Number((prev + segKm).toFixed(3)));
        }
      }
      lastPointRef.current = newPoint;
      setRoutePoints((prev) => [...prev, newPoint]);

      // 2. Auto-pause check: is athlete stationary?
      if (currentSpeedMs < APP_CONFIG.gps.stationarySpeedThresholdMs) {
        const now = Date.now();
        if (!stoppedSinceRef.current) {
          stoppedSinceRef.current = now;
        } else {
          const stoppedDurationSec = (now - stoppedSinceRef.current) / 1000;
          if (stoppedDurationSec >= APP_CONFIG.gps.autoPauseSeconds) {
            // Trigger Auto-Pause!
            setStatus('paused');
            setPauseReason('auto');
            showNotice('Corrida pausada automaticamente.\nVocê ficou parado por mais de 1 minuto.');
            stoppedSinceRef.current = null;
          }
        }
      } else {
        // Still moving normally
        stoppedSinceRef.current = null;
      }
    }

    // If currently PAUSED (Auto or Manual):
    else if (status === 'paused') {
      // Auto-resume check: has athlete resumed moving consistently?
      if (currentSpeedMs >= APP_CONFIG.gps.movingSpeedThresholdMs) {
        movingConsecutiveSamplesRef.current += 1;
        if (movingConsecutiveSamplesRef.current >= APP_CONFIG.gps.movingDebounceSamples) {
          // Trigger Auto-Resume!
          setStatus('running');
          setPauseReason(null);
          showNotice('▶ Corrida retomada', 3000);
          movingConsecutiveSamplesRef.current = 0;
          stoppedSinceRef.current = null;
          lastPointRef.current = newPoint;
        }
      } else {
        movingConsecutiveSamplesRef.current = 0;
      }
    }
  }, [status]);

  // Start Location GPS Watcher
  const startTracking = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    // Reset run values
    setDistanceKm(0);
    setMovingSeconds(0);
    setPausedSeconds(0);
    setRoutePoints([]);
    lastPointRef.current = null;
    stoppedSinceRef.current = null;
    movingConsecutiveSamplesRef.current = 0;
    setStatus('running');
    setPauseReason(null);

    // Instant position fetch to lock camera onto athlete immediately
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).then((instantPos) => {
      if (instantPos?.coords) {
        const pt: RunPoint = {
          latitude: instantPos.coords.latitude,
          longitude: instantPos.coords.longitude,
          altitude: instantPos.coords.altitude,
          speed: instantPos.coords.speed || 0,
          accuracy: instantPos.coords.accuracy,
          timestamp: instantPos.timestamp,
        };
        setCurrentLocation(pt);
        setIsGpsAcquired(true);
      }
    }).catch((e) => {
      console.warn('Instant GPS acquisition note:', e);
    });

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1, // update every meter
        },
        handleLocationUpdate
      );
      locationSubscriptionRef.current = sub;
    } catch (err: any) {
      setGpsError('Erro ao iniciar rastreador GPS: ' + err.message);
    }
  };

  // Pause Manual
  const pauseManual = () => {
    if (status === 'running') {
      setStatus('paused');
      setPauseReason('manual');
      stoppedSinceRef.current = null;
    }
  };

  // Resume Manual
  const resumeManual = () => {
    if (status === 'paused') {
      setStatus('running');
      setPauseReason(null);
      stoppedSinceRef.current = null;
      movingConsecutiveSamplesRef.current = 0;
      showNotice('▶ Corrida retomada', 3000);
    }
  };

  // Finish Run
  const finishRun = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    setStatus('finished');
  };

  // Reset to Idle
  const resetRun = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    setStatus('idle');
    setPauseReason(null);
    setDistanceKm(0);
    setMovingSeconds(0);
    setPausedSeconds(0);
    setRoutePoints([]);
    setAutoNotice(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    pauseReason,
    distanceKm,
    movingSeconds,
    pausedSeconds,
    averagePace,
    currentSpeedKmh,
    routePoints,
    currentLocation,
    isGpsAcquired,
    autoNotice,
    hasGpsPermission,
    gpsError,
    startTracking,
    pauseManual,
    resumeManual,
    finishRun,
    resetRun,
  };
}
