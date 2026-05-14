import React, { useEffect, useState } from 'react';
import {
  Platform,
  TouchableOpacity,
  Text,
  View,
  Modal,
  Dimensions,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Picker from 'react-mobile-picker';
import dayjs from 'dayjs';
import { Colors } from '../../constants/Colors';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DEFAULT_MIN_YEAR = 1900;
const DEFAULT_MAX_YEAR = 2100;

const { width } = Dimensions.get('window');

// Convert date string to dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = dayjs(date);
    if (!d.isValid()) return '';
    return d.format('DD/MM/YYYY');
  } catch {
    return '';
  }
};

// Safe date for mobile native picker
const safeDate = (input) => {
  if (!input) return new Date();
  const d = dayjs(input);
  return d.isValid() ? d.toDate() : new Date();
};

const DateSelector = ({
  value,
  onDateChange,
  placeholder = 'Select Date',
  style,
  textStyle,
  isDisabled = false,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const YEARS = React.useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(minYear + i)),
    [minYear, maxYear]
  );
  const minimumDate = React.useMemo(() => new Date(minYear, 0, 1), [minYear]);
  const maximumDate = React.useMemo(() => new Date(maxYear, 11, 31), [maxYear]);

  useEffect(() => {
    setTempDate(value || null);
  }, [value]);

  // --- Mobile (iOS + Android) Picker ---
  const renderMobilePicker = () => {
    if (Platform.OS === 'android') {
      return (
        showPicker &&
        <DateTimePicker
          value={safeDate(value)}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              const formatted = dayjs(selectedDate).format('YYYY-MM-DD');
              onDateChange(formatted);
            }
          }}
        />
      );
    }

    // iOS modal
    return (
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }
          ]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowPicker(false);
                setTempDate(value);
              }}>
                <Text style={{ fontSize: 16, color: colors.text }}>Cancel</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
                Select Date
              </Text>

              <TouchableOpacity
                onPress={() => {
                  onDateChange(tempDate);
                  setShowPicker(false);
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.tint }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={safeDate(tempDate)}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempDate(dayjs(selectedDate).format('YYYY-MM-DD'));
                }
              }}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // --- WEB WHEEL PICKER (react-mobile-picker) ---
  const renderWebPicker = () => {
    const base = tempDate && dayjs(tempDate).isValid() ? dayjs(tempDate) : dayjs();
    const selYear = base.year();
    const selMonth = base.month(); // 0-11
    const daysInSelMonth = dayjs(
      `${selYear}-${String(selMonth + 1).padStart(2, '0')}-01`
    ).daysInMonth();
    const selDay = Math.min(base.date(), daysInSelMonth);

    const days = Array.from({ length: daysInSelMonth }, (_, i) =>
      String(i + 1).padStart(2, '0')
    );

    const pickerValue = {
      day: String(selDay).padStart(2, '0'),
      month: MONTHS[selMonth],
      year: String(selYear),
    };

    const handlePickerChange = (newValue) => {
      const yearNum = parseInt(newValue.year, 10);
      const monthIdx = MONTHS.indexOf(newValue.month);
      const dayNum = parseInt(newValue.day, 10);
      const dim = dayjs(
        `${yearNum}-${String(monthIdx + 1).padStart(2, '0')}-01`
      ).daysInMonth();
      const safeDay = Math.min(dayNum, dim);
      setTempDate(
        dayjs(
          `${yearNum}-${String(monthIdx + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
        ).format('YYYY-MM-DD')
      );
    };

    return (
      <>
        {/* Input */}
        <TouchableOpacity
          onPress={() => !isDisabled && setShowPicker(!showPicker)}
          style={[
            styles.inputBox,
            { backgroundColor: isDisabled ? '#f2f2f2' : 'transparent' },
            style,
          ]}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          <Text
            style={[
              { color: value ? Colors.light.text : '#999', fontSize: 16 },
              textStyle,
            ]}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
        </TouchableOpacity>

        {/* Modal for Web - backdrop blocks all interactions */}
        <Modal
          visible={showPicker && !isDisabled}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.webBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowPicker(false)}
            />
            <View style={styles.webDropdownContainer}>
              <View style={styles.webDropdown}>
                <View style={styles.webWheelHeader}>
                  <TouchableOpacity onPress={() => {
                    setShowPicker(false);
                    setTempDate(value);
                  }}>
                    <Text style={{ fontSize: 16, color: '#333' }}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                    Select Date
                  </Text>
                  <TouchableOpacity onPress={() => {
                    onDateChange(tempDate);
                    setShowPicker(false);
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#C2000E' }}>
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>

                <Picker value={pickerValue} onChange={handlePickerChange} wheelMode="natural">
                  <Picker.Column name="day">
                    {days.map((d) => (
                      <Picker.Item key={d} value={d}>{d}</Picker.Item>
                    ))}
                  </Picker.Column>
                  <Picker.Column name="month">
                    {MONTHS.map((m) => (
                      <Picker.Item key={m} value={m}>{m}</Picker.Item>
                    ))}
                  </Picker.Column>
                  <Picker.Column name="year">
                    {YEARS.map((y) => (
                      <Picker.Item key={y} value={y}>{y}</Picker.Item>
                    ))}
                  </Picker.Column>
                </Picker>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <View>
      {Platform.OS === 'web'
        ? renderWebPicker()
        : <>
            <TouchableOpacity
              onPress={() => !isDisabled && setShowPicker(true)}
              style={[styles.inputBox, style]}
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
            {!isDisabled && renderMobilePicker()}
          </>
      }
    </View>
  );
};

export default DateSelector;

// --- STYLES ---
const styles = StyleSheet.create({
  inputBox: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#C2000E',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 50,
  },
  webCalendarWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
  },  
  webBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webDropdownContainer: {
    width: '90%',
    maxWidth: 400,
    zIndex: 1,
    position: 'relative',
  },
  webDropdown: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
    elevation: 10,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContainer: {
    width: Math.min(width, 440),
    alignSelf: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  webWheelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
});
