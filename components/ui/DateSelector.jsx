import React, { useEffect, useState } from 'react';
import { Platform, TouchableOpacity, Text, View, Modal, Dimensions, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/Colors';
import { DatePicker } from 'rsuite';
import 'rsuite/DatePicker/styles/index.css';
import { styled } from 'styled-components';
// import { on } from 'rsuite/esm/DOMHelper';

const { width } = Dimensions.get('window');

export const CustomDatePicker = styled(DatePicker)`
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
    font-size: 16px
  }

  .rs-picker-caret-icon.rs-icon.rs-icon {
    font-size: 18px !important;
    color: #999;
  }
 
  .rs-input-group.rs-input-group-inside {
    background-color:${(props) => props.disabled ? '#ddd' : 'transparent'};
    width: 100%;
    border: 1px solid #DDDDDD;
    padding: 6px 8px;
    margin-bottom: 15px;
  }

  .rs-input-group.rs-input-group-inside .rs-input-group-addon {
    background: none;
    background-color:transparent; 
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


const safeParseDate = (dateStr) => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};


const DateSelector = ({
  value,
  onDateChange,
  placeholder = "Select Date",
  style,
  textStyle,
  isDisabled = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  // const [tempDate, setTempDate] = useState(value || new Date());
  const [tempDate, setTempDate] = useState(value || new Date().toISOString().split('T')[0]);
  const colorScheme = useColorScheme();
  // Get colors based on theme (defaulting to light theme)
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    console.log(colorScheme);
  }, [colorScheme]);



  const formatDate = (date) => {
    if (!date) return '';

    const parsedDate = typeof date === 'string' ? new Date(date) : date;

    return parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        onDateChange(selectedDate.toISOString().split('T')[0]);
      }
    } else {
      // For iOS, we store the temp date and let user confirm
      if (selectedDate) {
        setTempDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };

  const openPicker = () => {
    setTempDate(value || new Date());
    setShowPicker(true);
  };

  const renderPicker = () => {
    if (Platform.OS === 'android') {
      return showPicker ? (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      ) : null;
    }
    else {
      // iOS and Web - show in modal
      return (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}>
            <View style={{
              backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
              width: Math.min(width, 440),
              alignSelf: 'center'
            }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                paddingHorizontal: 10
              }}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '500'
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: colors.text
                }}>
                  Select Birthday
                </Text>

                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={{
                    color: colors.tint,
                    fontSize: 16,
                    fontWeight: 'bold'
                  }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{
                alignItems: 'center',
                paddingHorizontal: 20
              }}>
                <DateTimePicker
                  value={new Date(tempDate)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  style={{
                    width: '100%',
                    maxWidth: 440
                  }}
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
      {/* {renderPicker()} */}
      {Platform.OS === 'web' ? (
        <CustomDatePicker
          placeholder={placeholder}
          value={safeParseDate(tempDate) || undefined}
          onChange={(date) => {
            if (date) {
              const formattedDate = date.toISOString().split('T')[0];
              setTempDate(formattedDate);
              onDateChange(formattedDate);
            } else {
              // If user clicked the clear button or cancelled
              setTempDate(null);
              onDateChange(null);
            }
          }}
          disabled={isDisabled}
          oneTap
          defaultValue={null}
          cleanable={true}
        />

      ) : <TouchableOpacity
        onPress={openPicker}
        style={[{
          padding: 15,
          borderWidth: 1,
          borderColor: '#C2000E',
          borderRadius: 8,
          backgroundColor: isDisabled ? '#f2f2f2' : 'transparent',
          justifyContent: 'center',
          minHeight: 50
        }, style]}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        <Text style={[{
          color: value ? Colors.light.text : '#999',
          fontSize: 16
        }, textStyle]}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>}

      {Platform.OS !== 'web' && !isDisabled && renderPicker()}
    </View>
  );
};

export default DateSelector; 