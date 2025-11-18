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
import DatePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

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
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    if (value) setTempDate(value);
  }, [value]);

  // --- Mobile (iOS + Android) Picker ---
  const renderMobilePicker = () => {
    if (Platform.OS === 'android') {
      return (
        showPicker &&
        <DateTimePicker
          value={safeDate(value)}
          mode="date"
          display="calendar"
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

  // --- WEB DROPDOWN PICKER ---
  const renderWebPicker = () => (
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

      {/* Modal for Web - ensures backdrop blocks all interactions */}
      <Modal
        visible={showPicker && !isDisabled}
        transparent={true}
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
              <View style={styles.webCalendarWrapper}>
                <DatePicker
                  mode="single"
                  date={dayjs(value)}
                  onChange={({ date }) => {
                    if (date) {
                      const formatted = dayjs(date).format('YYYY-MM-DD');
                      onDateChange(formatted);
                      setShowPicker(false);
                    }
                  }}
                  minDate={dayjs('1900-01-01')}
                  maxDate={dayjs('2100-12-31')}
                  components={{
                    IconPrev: <Ionicons name="chevron-back" size={20} color="#333" />,
                    IconNext: <Ionicons name="chevron-forward" size={20} color="#333" />,
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

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
});
