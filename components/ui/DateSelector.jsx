import React, { useEffect, useState } from 'react';
import {
  Platform,
  TouchableOpacity,
  Text,
  View,
  Modal,
  Dimensions,
  useColorScheme,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

// ✅ Conditionally import web-only dependencies
let CustomDatePicker = null;
if (Platform.OS === 'web') {
  const { DatePicker } = require('rsuite');
  const { styled } = require('styled-components');
  require('rsuite/DatePicker/styles/index.css');

  CustomDatePicker = styled(DatePicker)`
    .rs-input {
      color: black !important;
      font-family: 'RobotoSlab-Regular';
      font-size: 16px !important;
    }

    .rs-input[disabled] {
      color: #999 !important;
      cursor: default !important;
      background: transparent;
    }

    .rs-input::placeholder {
      color: #999;
      font-size: 16px;
    }

    .rs-picker-caret-icon.rs-icon.rs-icon {
      font-size: 18px !important;
      color: #999;
    }

    .rs-input-group.rs-input-group-inside {
      background-color: ${(props) => (props.disabled ? '#ddd' : 'transparent')};
      width: 100%;
      border: 1px solid #DDDDDD;
      padding: 6px 8px;
      margin-bottom: 15px;
    }

    .rs-input-group.rs-input-group-inside .rs-input-group-addon {
      background: none;
      border: none;
      padding: 10px 12px;
      top: 0;
    }

    .rs-input-group.rs-input-group-inside .rs-input {
      border: none;
      background-color: transparent;
      outline: none;
      width: 100%;
      display: block;
    }

    input {
      padding: 10px;
      background: transparent;
      color: #999;
    }
  `;
}

// ✅ Safe date utility - ensures local date components (avoids timezone issues)
const toLocalISODateString = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  
  // Use local date components to avoid timezone conversion issues
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// ✅ Convert Android picker date to local date (avoid timezone issues)
const normalizeAndroidDate = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  
  // Extract local date components and create a new date at noon to avoid timezone edge cases
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Create date at noon local time to avoid timezone boundary issues
  return new Date(year, month, day, 12, 0, 0, 0);
};

const safeDate = (input) => {
  if (!input) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }
  
  if (input instanceof Date && !isNaN(input.getTime())) {
    // Normalize existing Date to ensure local date representation
    return normalizeAndroidDate(input);
  }

  try {
    const normalized = typeof input === 'string' ? input.split('T')[0] : input;
    if (typeof normalized === 'string') {
      const parts = normalized.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts.map((part) => Number(part));
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          // Create date at noon local time to avoid timezone edge cases
          return new Date(year, month - 1, day, 12, 0, 0, 0);
        }
      }
    }

    const parsed = new Date(normalized);
    if (isNaN(parsed.getTime())) {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    }
    // Normalize parsed date to local representation
    return normalizeAndroidDate(parsed);
  } catch {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  }
};

// ✅ Safe parse for web DatePicker
const safeParseDate = (dateStr) => {
  if (!dateStr) return null;
  const base = safeDate(dateStr);
  return isNaN(base.getTime()) ? null : base;
};

const DateSelector = ({
  value,
  onDateChange,
  placeholder = 'Select Date',
  style,
  textStyle,
  isDisabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const initialDate = value || toLocalISODateString(new Date());
  const [tempDate, setTempDate] = useState(initialDate);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (value) {
      setTempDate(value);
    }
  }, [value]);

  const formatDate = (date) => {
  if (!date) return '';

  try {
    // Handle both Date object and string (with or without time)
    const normalized = typeof date === 'string'
      ? date.split('T')[0] // strip time if ISO string
      : date.toISOString().split('T')[0];

    const [year, month, day] = normalized.split('-');
    return `${day}/${month}/${year}`; // always dd/mm/yyyy
  } catch {
    return '';
  }
};

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        // Normalize Android date to ensure correct local date representation
        const normalizedDate = normalizeAndroidDate(selectedDate);
        onDateChange(toLocalISODateString(normalizedDate));
      }
    } else {
      if (selectedDate) {
        // Normalize iOS date to ensure correct local date representation
        const normalizedDate = normalizeAndroidDate(selectedDate);
        setTempDate(toLocalISODateString(normalizedDate));
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value || toLocalISODateString(new Date()));
    setShowPicker(false);
  };

  const openPicker = () => {
    if (isDisabled) return;
    setTempDate(value || toLocalISODateString(new Date()));
    setShowPicker(true);
  };

  const renderPicker = () => {
    if (Platform.OS === 'android') {
      return showPicker ? (
        <DateTimePicker
          value={safeDate(value)}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(1900, 0, 1)}
        />
      ) : null;
    } else {
      return (
        <Modal visible={showPicker} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <View
              style={{
                backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                paddingBottom: Platform.OS === 'ios' ? 40 : 20,
                width: Math.min(width, 440),
                alignSelf: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20,
                  paddingHorizontal: 10,
                }}
              >
                <TouchableOpacity onPress={handleCancel}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: '500',
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: colors.text,
                  }}
                >
                  Select Date
                </Text>

                <TouchableOpacity onPress={handleConfirm}>
                  <Text
                    style={{
                      color: colors.tint,
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                <DateTimePicker
                  value={safeDate(tempDate)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date(2100, 11, 31)}
                  minimumDate={new Date(1900, 0, 1)}
                  style={{ width: '100%', maxWidth: 440 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      );
    }
  };

  return (
    <View>
      {Platform.OS === 'web' && CustomDatePicker ? (
        <CustomDatePicker
          placeholder={placeholder}
          value={safeParseDate(tempDate) || undefined}
          onChange={(date) => {
            if (date) {
              const formattedDate = date.toISOString().split('T')[0];
              setTempDate(formattedDate);
              onDateChange(formattedDate);
            } else {
              setTempDate(null);
              onDateChange(null);
            }
          }}
          disabled={isDisabled}
          oneTap
          defaultValue={null}
          cleanable
        />
      ) : (
        <TouchableOpacity
          onPress={openPicker}
          style={[
            {
              padding: 15,
              borderWidth: 1,
              borderColor: '#C2000E',
              borderRadius: 8,
              backgroundColor: isDisabled ? '#f2f2f2' : 'transparent',
              justifyContent: 'center',
              minHeight: 50,
            },
            style,
          ]}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          <Text
            style={[
              {
                color: value ? Colors.light.text : '#999',
                fontSize: 16,
              },
              textStyle,
            ]}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
        </TouchableOpacity>
      )}

      {Platform.OS !== 'web' && !isDisabled && renderPicker()}
    </View>
  );
};

export default DateSelector;
