import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, TextInput, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  style
}) {
  const inputRefs = useRef([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    // Focus the first empty input or the next input after typing
    const nextIndex = Math.min(value.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
      setFocusedIndex(nextIndex);
    }
  }, [value, length]);

  const handleChange = (text, index) => {
    if (text.length > 1) {
      text = text[text.length - 1]; // Take only the last character
    }

    const newValue = value.split('');
    newValue[index] = text;
    const result = newValue.join('');

    onChange(result);

    // Auto-focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Check if OTP is complete
    if (result.length === length && onComplete) {
      onComplete(result);
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newValue = value.split('');
      newValue[index - 1] = '';
      const result = newValue.join('');

      onChange(result);
      setFocusedIndex(index - 1);
    }
  };

  const handleFocus = (index) => {
    setFocusedIndex(index);
  };

  const renderInputs = () => {
    const inputs = [];
    for (let i = 0; i < length; i++) {
      inputs.push(
        <TextInput
          key={i}
          ref={(ref) => {
            if (ref) inputRefs.current[i] = ref;
          }}
          style={[
            styles.input,
            focusedIndex === i && styles.inputFocused,
          ]}
          maxLength={1}
          keyboardType="numeric"
          value={value[i] || ''}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          onFocus={() => handleFocus(i)}
          selectTextOnFocus
          selectionColor="#C2000E"
        />
      );
    }
    return inputs;
  };

  return (
    <View style={[styles.container, style]}>
      {renderInputs()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    width: width >= 440 ? 440 * 0.115 : 0.115 * width,
    height: width >= 440 ? 440 * 0.135 : 0.13 * width,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: width > 360 ? 24 : 21,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    fontFamily: 'RobotoSlab-Bold',
    color: '#333',
    marginHorizontal: 2,
  },
  inputFocused: {
    borderColor: '#999',
    borderWidth: 1,
    shadowColor: '#999',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#F8FBFF',
  },
}); 