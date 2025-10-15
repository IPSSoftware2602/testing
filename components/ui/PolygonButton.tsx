import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

interface PolygonButtonProps {
  width?: number;
  height?: number;
  text: string;
  color?: string;
  textColor?: string;
  textStyle?: object;
  onPress?: () => void;
  style?: object;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PolygonButton({
  width = 160,
  height = 48,
  text,
  color = '#C2000E',
  textColor = '#FFFFFF',
  textStyle = {},
  onPress,
  style = {},
  icon,
  children,
}: PolygonButtonProps) {
  // Calculate polygon points based on width and height
  // The shape has angled sides on the left and right
  // We'll use about 20% of the width for the angled part
  const angleWidth = Math.min(height / 2, width * 0.05);
  
  const points = [
    `${angleWidth+5},0`, // Top left after angle
    `${width - angleWidth-5},0`, // Top right before angle
    `${width},${height/1.5}`, // Right middle
    `${width - angleWidth},${height}`, // Bottom right before angle
    `${angleWidth},${height}`, // Bottom left after angle
    `0,${height/1.5}`, // Left middle
  ].join(' ');

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.container, { width, height }, style]}
      activeOpacity={0.8}
    >
      <View style={styles.svgContainer}>
        <Svg width={width} height={height}>
          <Polygon
            points={points}
            fill={color}
            strokeWidth="0"
          />
        </Svg>
      </View>
      <View style={[styles.contentRow]}>
        <Text style={[
          styles.text,
          { color: textColor },
          textStyle,
          icon ? { marginRight: 8 } : null,
        ]}>
          {text}
        </Text>
        {icon}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    position: 'absolute',
    bottom: '8%',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Route159-HeavyItalic',
  },
}); 