import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export const normalizeCoordinates = (data: any): RoutePoint[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    if (typeof data[0] === 'object' && 'latitude' in data[0]) {
      return data;
    }
    if (Array.isArray(data[0])) {
      return (data as [number, number][]).map(([lon, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lon,
      }));
    }
  }
  if (data.coordinates && Array.isArray(data.coordinates)) {
    const coords = data.coordinates;
    if (coords.length > 0) {
      if (typeof coords[0] === 'object' && 'latitude' in coords[0]) return coords;
      if (Array.isArray(coords[0])) {
        return (coords as [number, number][]).map(([lon, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lon,
        }));
      }
    }
  }
  if (data.points && Array.isArray(data.points)) {
    return data.points;
  }
  return [];
};

export const computeRouteSvg = (
  points: RoutePoint[],
  width: number,
  height: number,
  padding: number = 8
) => {
  if (points.length < 2) return null;

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const p of points) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  // Real world aspect ratio compensation
  const avgLat = (minLat + maxLat) / 2;
  const cosLat = Math.max(Math.cos((avgLat * Math.PI) / 180), 0.1);
  const geoWidth = lngSpan * cosLat;
  const geoHeight = latSpan;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  if (geoWidth <= 0 && geoHeight <= 0) return null;

  const safeGeoW = geoWidth <= 0 ? 0.0001 : geoWidth;
  const safeGeoH = geoHeight <= 0 ? 0.0001 : geoHeight;

  const scale = Math.min(innerW / safeGeoW, innerH / safeGeoH);
  const renderedW = safeGeoW * scale;
  const renderedH = safeGeoH * scale;

  const offsetX = padding + (innerW - renderedW) / 2;
  const offsetY = padding + (innerH - renderedH) / 2;

  const svgPoints = points.map((p) => {
    const x = offsetX + (p.longitude - minLng) * cosLat * scale;
    const y = offsetY + (maxLat - p.latitude) * scale;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const path = `M ${svgPoints.join(' L ')}`;
  const startPoint = svgPoints[0].split(',').map(Number);
  const endPoint = svgPoints[svgPoints.length - 1].split(',').map(Number);

  return {
    path,
    start: { x: startPoint[0], y: startPoint[1] },
    end: { x: endPoint[0], y: endPoint[1] },
  };
};

interface RouteThumbnailProps {
  coordinates?: any;
  width: number;
  height: number;
  strokeColor?: string;
  strokeWidth?: number;
  padding?: number;
  glow?: boolean;
  showEndpoints?: boolean;
  containerStyle?: ViewStyle;
}

export const RouteThumbnail: React.FC<RouteThumbnailProps> = ({
  coordinates,
  width,
  height,
  strokeColor = '#FF5722',
  strokeWidth = 3,
  padding = 6,
  glow = false,
  showEndpoints = true,
  containerStyle,
}) => {
  const points = normalizeCoordinates(coordinates);
  const svgData = computeRouteSvg(points, width, height, padding);

  if (!svgData) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }, containerStyle]}>
      <Svg width={width} height={height}>
        {glow && (
          <Path
            d={svgData.path}
            fill="none"
            stroke="rgba(255, 87, 34, 0.35)"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <Path
          d={svgData.path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {showEndpoints && (
          <>
            {/* Start point dot (Emerald Green) */}
            <Circle
              cx={svgData.start.x}
              cy={svgData.start.y}
              r={strokeWidth + 1}
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />

            {/* Finish point dot (Vibrant Red) */}
            <Circle
              cx={svgData.end.x}
              cy={svgData.end.y}
              r={strokeWidth + 1}
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          </>
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
