import { RunPoint } from '../types';
import { APP_CONFIG } from '../constants/config';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats moving duration in seconds to "HH:MM:SS" or "MM:SS"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculates average pace string "M:SS /km" from moving seconds and distance in km
 */
export function calculateAveragePace(movingSeconds: number, distanceKm: number): string {
  if (distanceKm <= 0.05 || movingSeconds <= 5) {
    return '--:-- /km';
  }

  const secondsPerKm = movingSeconds / distanceKm;
  if (!isFinite(secondsPerKm) || secondsPerKm > 3600) {
    return '--:-- /km';
  }

  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/**
 * Calculates average speed in km/h
 */
export function calculateAverageSpeedKmh(distanceKm: number, movingSeconds: number): number {
  if (movingSeconds <= 0 || distanceKm <= 0) return 0;
  return Number(((distanceKm / movingSeconds) * 3600).toFixed(2));
}

/**
 * Validates a completed run against anti-cheat physical thresholds
 * Returns: { isApproved: boolean, reason?: string }
 */
export function validateRunPhysicalLimits(
  distanceKm: number,
  movingSeconds: number,
  points?: RunPoint[]
): { isApproved: boolean; status: 'approved' | 'pending_review'; reason?: string } {
  // If run is very short, approve automatically
  if (distanceKm < 0.2) {
    return { isApproved: true, status: 'approved' };
  }

  const speedKmh = calculateAverageSpeedKmh(distanceKm, movingSeconds);

  // Exceeds human running speed limit (e.g. car, bike, motorcycle)
  if (speedKmh > APP_CONFIG.validation.maxRunningKmh) {
    return {
      isApproved: false,
      status: 'pending_review',
      reason: `Velocidade média anormal (${speedKmh} km/h superior ao limite humano de 25 km/h). Encaminhado para revisão do organizador.`
    };
  }

  // Check point-to-point instant speed anomalies if points are present
  if (points && points.length > 2) {
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const timeDiffSec = (curr.timestamp - prev.timestamp) / 1000;
      if (timeDiffSec > 0.5) {
        const segDistKm = calculateHaversineDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        );
        const instantSpeedKmh = (segDistKm / timeDiffSec) * 3600;
        // Speeds above 45 km/h indicate vehicle transport or GPS teleportation
        if (instantSpeedKmh > 45) {
          return {
            isApproved: false,
            status: 'pending_review',
            reason: `Salto instantâneo de velocidade detectado (${instantSpeedKmh.toFixed(1)} km/h). Encaminhado para revisão do organizador.`
          };
        }
      }
    }
  }

  return { isApproved: true, status: 'approved' };
}
