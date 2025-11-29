import React, { useRef, useState, useEffect } from 'react';
import { Dimensions, StyleSheet, TextInput, View, Pressable, Text } from 'react-native';

const { width } = Dimensions.get('window');

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  style
}) {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Focus the input when component mounts
  useEffect(() => {
    // Optional: Auto-focus on mount
    // inputRef.current?.focus();
  }, []);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');

    // Limit to length
    if (numericText.length <= length) {
      onChange(numericText);

      if (numericText.length === length && onComplete) {
        onComplete(numericText);
      }
    }
  };

  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < length; i++) {
      const digit = value[i] || '';
      const isCurrentFocus = isFocused && i === value.length;

      boxes.push(
        <View
          key={i}
          style={[
            styles.box,
            (isCurrentFocus || (i === length - 1 && value.length === length && isFocused)) && styles.boxFocused,
            digit && styles.boxFilled
          ]}
        >
          <Text style={styles.text}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <Pressable style={[styles.container, style]} onPress={handlePress}>
      {renderBoxes()}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode" // iOS OTP autofill
        autoComplete="sms-otp" // Android OTP autofill
        style={styles.hiddenInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden={true}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    position: 'relative',
  },
  box: {
    width: width >= 440 ? 440 * 0.115 : 0.115 * width,
    height: width >= 440 ? 440 * 0.135 : 0.13 * width,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
  boxFocused: {
    borderColor: '#999',
    borderWidth: 1,
    shadowColor: '#999',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#F8FBFF',
  },
  boxFilled: {
    // Optional style for filled boxes
  },
  text: {
    fontSize: width > 360 ? 24 : 21,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold',
    color: '#333',
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0, // Hide the input but keep it interactive
    zIndex: 1, // Ensure it sits on top to capture touches if needed, but Pressable handles it
  },
});