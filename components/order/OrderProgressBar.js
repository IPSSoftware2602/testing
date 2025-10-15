import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';

export default function OrderProgressBar({ mode = 'delivery', currentStep = 1, status = "preparing" }) {
  // Step configuration
  const MAX_STEPS = mode === 'delivery' ? 4 : 3;

  const deliveryStatus = {
    "preparing": 1,
    "picked_up": 2,
    "on_the_way": 3,
    "completed": 4,
  }
  const pickupStatus = {
    "preparing": 1,
    "ready_to_pickup": 2,
    "completed": 3,
  }

  if (mode === "delivery") {
    currentStep = deliveryStatus[status] ?? 1
  }
  else {
    currentStep = pickupStatus[status] ?? 1
  }

  const clampedStep = Math.min(currentStep, MAX_STEPS); // Ensure step doesn't exceed max

  let steps = [];
  if (mode === 'delivery') {
    steps = [
      { icon: <MaterialIcons name="store" size={20} color="#fff" />, done: clampedStep >= 1 }, //preparing
      { icon: <Feather name="shopping-bag" size={20} color="#fff" />, done: clampedStep >= 2 }, //driver picked up
      { icon: <MaterialIcons name="local-shipping" size={20} color="#fff" />, done: clampedStep >= 3 }, //delivery
      { icon: <Feather name="check-circle" size={20} color="#fff" />, done: clampedStep >= 4 }, //completed
    ];
  } else {
    steps = [
      { icon: <MaterialIcons name="store" size={20} color="#fff" />, done: clampedStep >= 1 }, //preparing
      //  { icon: <MaterialIcons name="restaurant-menu" size={20} color="#fff" />, done: clampedStep >= 2 }, //ready to pick up
      { icon: <Feather name="shopping-bag" size={20} color="#fff" />, done: clampedStep >= 2 }, //ready to pick up
      { icon: <Feather name="check-circle" size={20} color="#fff" />, done: clampedStep >= 3 }, //completed
    ];
  }

  const segmentWidth = 1 / (steps.length - 1);
  const isComplete = clampedStep >= MAX_STEPS;

  // Animation refs
  const solidAnim = useRef(new Animated.Value(0)).current;
  const loopAnim = useRef(new Animated.Value(0)).current;

  // Solid progress animation (completed segments)
  useEffect(() => {
    Animated.timing(solidAnim, {
      toValue: isComplete ? 1 : (clampedStep - 1) * segmentWidth,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedStep]);

  // Looping animation (only if not complete)
  useEffect(() => {
    if (isComplete) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loopAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(loopAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        })
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [clampedStep, isComplete]);

  // Interpolated widths
  const solidWidth = solidAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const loopWidth = loopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${segmentWidth * 100}%`],
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {/* Background Track */}
        <View style={styles.barContainer}>
          <View style={[styles.barLight, { width: '100%' }]} />
        </View>

        {/* Solid Completed Segments */}
        <View style={styles.barContainer}>
          <Animated.View style={[
            styles.barRed,
            { width: solidWidth }
          ]} />
        </View>

        {/* Looping Progress Animation (only if not complete) */}
        {!isComplete && (
          <View style={styles.barContainer}>
            <Animated.View style={[
              styles.barRed,
              {
                position: 'absolute',
                left: `${(clampedStep - 1) * segmentWidth * 100}%`,
                width: loopWidth,
                opacity: loopAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.7, 1, 0.7]
                })
              }
            ]} />
          </View>
        )}

        {/* Step Circles */}
        <View style={styles.stepsRow}>
          {steps.map((step, idx) => (
            <View
              key={idx}
              style={[
                styles.circle,
                step.done ? styles.circleRed : styles.circleLight,
                idx === steps.length - 1 && styles.lastCircle,
                isComplete && idx === steps.length - 1 && styles.completedCircle
              ]}
            >
              {step.icon}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barContainer: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    height: 5,
    flexDirection: 'row',
    zIndex: 0,
  },
  barRed: {
    // flex: 0.8,
    backgroundColor: '#E60012',
    height: 5,
    borderRadius: 2.5,
  },
  barLight: {
    // flex: 0.2,
    backgroundColor: '#FDE7E7',
    height: 5,
    borderRadius: 2.5,
  },
  stepsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E60012',
    zIndex: 2,
  },
  circleRed: {
    backgroundColor: '#E60012',
  },
  circleLight: {
    backgroundColor: '#FDE7E7',
  },
  lastCircle: {
    borderWidth: 0,
  },
  completedCircle: {
    backgroundColor: '#E60012', // Green color for completed state
    // shadowColor: '#E60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
}); 