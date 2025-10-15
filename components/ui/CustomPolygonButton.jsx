import { Dimensions, StyleSheet, View, TouchableOpacity, Text } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { fonts } from "../../styles/common";

const defaultWidth = Math.min(Dimensions.get('window').width, 440) * 0.95;
const height = 50;
const extrude = 0; // Height of the extruded face
const angle = 20;

export function CustomPolygonButton({ width = defaultWidth, label = "Click Me", onPress, disabled = false, labelStyle = {}, }) {
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
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} disabled={disabled}>
            <View style={styles.container}>
                <Svg width={width} height={height + extrude}>
                    {/* Top face */}
                    <Polygon points={topPoints} fill="#E60012" />
                    {/* Bottom extruded face */}
                    <Polygon points={bottomPoints} fill="#C2000E" />
                </Svg>
                <View style={[styles.labelContainer, { width }]}>
                    <Text style={[styles.labelText, labelStyle]}>{label}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // position: 'relative',
        // bottom: 0,
        width: '100%',
        height: height + extrude,
        // zIndex: 0,
    },
    labelContainer: {
        position: 'absolute',
        top: (height / 4) - (height * 0.12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    labelText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        fontFamily: 'Route159-Heavy',
        textAlign: 'center',
    },

});