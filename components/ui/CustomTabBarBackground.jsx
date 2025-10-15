import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

// const width = Math.min(Dimensions.get('window').width, 440) * 0.95;
const height = 50;
const extrude = 0; // Height of the extruded face
const angle = 20;

export function CustomTabBarBackground({ width = Math.min(Dimensions.get('window').width, 440) * 0.95 }) {
  // Top face (main polygon)
  const topPoints = `
    ${angle - 5},0
    ${width - angle + 5},0
    ${width},${height / 1.5}
    ${width - angle + 5},${height}
    ${angle - 5},${height}
    0,${height / 1.5}
  `;

  // Bottom face (extruded polygon)
  const bottomPoints = `
    0,${height / 1.5}
    ${width},${height / 1.5}
    ${width - angle + 5},${height + extrude}
    ${angle - 5},${height + extrude}
  `;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height + extrude}>
        {/* Top face */}
        <Polygon points={topPoints} fill="#E60012" />
        {/* Bottom extruded face */}
        <Polygon points={bottomPoints} fill="#C2000E" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height + extrude,
    zIndex: 0,
  },
});