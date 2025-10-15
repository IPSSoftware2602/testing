import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions,StyleSheet, Text, View, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');


interface BeansUpgradeIndicatorProps {
  beansNeeded: number;
  totalBeansForUpgrade: number;
  nextTierName: string;
  currentTierName: string;
}

export default function BeansUpgradeIndicator({ beansNeeded, totalBeansForUpgrade, nextTierName, currentTierName }: BeansUpgradeIndicatorProps) {

  if (!nextTierName && !currentTierName) return null;

  if (nextTierName) {
    const progress = Math.min(1 - (beansNeeded / totalBeansForUpgrade), 1);
    const arrowPosition = progress * 100;

    return (
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#FFF6ED', '#E60012']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progress, { width: `100%` } as ViewStyle]}
          />
        </View>
        <View style={[styles.arrowContainer, { left: `${arrowPosition}%` } as ViewStyle]}>
          <View style={styles.arrow} />
        </View>
        <Text style={styles.text}>
          Spend another {beansNeeded} US beans to upgrade to {nextTierName}
        </Text>
      </View>
    );
  }

  if (!nextTierName && currentTierName) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Your current tier is: {currentTierName}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FFE5E5',
    overflow: 'hidden',
    marginTop: 8,
  },
  progress: {
    height: '100%'
  },
  arrowContainer: {
    position: 'absolute',
    top: -4,
    transform: [{ translateX: -6 }],
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#E60012',
  },
  text: {
    color: '#727171',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 11) : 14) : 14,
    fontFamily: 'Route159-Regular',
    marginTop: 8,
  },
}); 