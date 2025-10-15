import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

interface GridBackgroundProps {
  children: React.ReactNode;
  gridSize?: number;
  gridColor?: string;
  gridOpacity?: number;
  backgroundColor?: string;
  style?: any;
}

export default function GridBackground({
  children,
  gridSize = 20,
  gridColor = '#E60012',
  gridOpacity = 0.1,
  backgroundColor = 'transparent',
  style
}: GridBackgroundProps) {
  const patternId = `grid-pattern-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
      >
        <Defs>
          <Pattern
            id={patternId}
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Vertical lines */}
            <Line
              x1={gridSize}
              y1="0"
              x2={gridSize}
              y2={gridSize}
              stroke={gridColor}
              strokeWidth="0.5"
              opacity={gridOpacity}
            />
            {/* Horizontal lines */}
            <Line
              x1="0"
              y1={gridSize}
              x2={gridSize}
              y2={gridSize}
              stroke={gridColor}
              strokeWidth="0.5"
              opacity={gridOpacity}
            />
          </Pattern>
        </Defs>

        <Rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
        />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
}); 