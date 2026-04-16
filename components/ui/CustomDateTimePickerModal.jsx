import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Modal, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../app/constant/constants';
const { validateStoredOrderDateTime, formatLocalDate, isOutletOpenNow } = require('../../utils/order_datetime');
const { nowInMY, formatMYDate, formatMYDateTime } = require('../../utils/timezone');

// REQ-001: ASAP is the canonical "as soon as possible" sentinel.
const ASAP = 'ASAP';

const { width, height } = Dimensions.get('window');

export default function CustomDateTimePickerModal({ showDateTimePicker = false, setShowDateTimePicker, setSelectedDateTime = null, outletId, orderType = 'delivery', modalMessage = '', setModalMessage = null }) {
    const router = useRouter();
    // const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    // const [isToday, setIsToday] = useState(false); // Deprecated
    const [outlet, setOutlet] = useState(null);
    const [authToken, setAuthToken] = useState("");
    // const [exceptionTimes, setExceptionTimes] = useState([]); // Deprecated
    // const [partialOpenDate, setPartialOpenDate] = useState(null); // Deprecated
    const [estimatedTime, setEstimatedtime] = useState({});
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);
    const [noticeMessage, setNoticeMessage] = useState('');

    useEffect(() => {
        setNoticeMessage(modalMessage || '');
    }, [modalMessage]);

    useEffect(() => {
        const syncModalData = async () => {
            try {
                const estimatedTime = await AsyncStorage.getItem('estimatedTime');
                if (estimatedTime) {
                    const parsedEstimatedTime = JSON.parse(estimatedTime);
                    setEstimatedtime(parsedEstimatedTime);
                }
            } catch (err) {
                console.log(err?.response?.data?.message);
            }

            if (outletId) {
                fetchOutlets();
            }
        };

        if (showDateTimePicker) {
            syncModalData();
        }
    }, [showDateTimePicker, outletId])

    // useEffect(() => {
    //     if (outlet) {
    //         console.log(outlet);
    //     }
    // }, [outlet])

    const fetchOutlets = async () => {
        try {
            const response = await axios.get(
                `${apiUrl}outlets/${outletId}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

            const outletData = await response.data;

            // console.log("Outlets:", outletData.result);
            setOutlet(outletData.result);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    const updateNoticeMessage = (message) => {
        setNoticeMessage(message || '');
        if (setModalMessage) {
            setModalMessage(message || '');
        }
    };

    // REQ-001: Single canonical write path. Stores the YYYY-MM-DD HH:MM shape
    // for scheduled slots, or the ASAP shape for ASAP. NEVER writes display
    // labels like "Today 14:00" — those are derived at render time only.
    const persistEstimatedTime = async (mode) => {
        let payload;
        if (mode === ASAP) {
            payload = { estimatedTime: ASAP, date: null, time: null };
        } else {
            const date = selectedDate;
            if (!date || !selectedTime) return;
            const dateStr = formatMYDate(date);
            const timeStr = String(selectedTime).slice(0, 5);
            payload = {
                estimatedTime: `${dateStr} ${timeStr}`,
                date: dateStr,
                time: timeStr,
            };
        }
        setSelectedDateTime(payload.estimatedTime);
        try {
            await AsyncStorage.setItem('estimatedTime', JSON.stringify(payload));
        } catch (err) {
            console.log(err?.response?.data?.message);
        }
    };

    // REQ-001: convertToDateTimeString, setEstimaedTime, and handleDateTimeChange
    // were removed. They parsed display labels with `new Date()` and bare wall-clock
    // and were the source of off-by-one bugs. The new persistEstimatedTime() above
    // is the single canonical write path.

    // Helper to calculate available slots for a given date.
    // REQ-002: All time math anchored to Malaysia time, not device time.
    const getAvailableSlots = (date, outletData) => {
        if (!outletData || !date) return [];

        const day = date.getDay(); // 0 = Sunday
        const now = nowInMY().toDate();

        // Build list of delivery setting objects to iterate
        let settingsList = [];
        if (outletData.delivery_settings && Array.isArray(outletData.delivery_settings) && outletData.delivery_settings.length > 0) {
            settingsList = outletData.delivery_settings;
        } else if (outletData.delivery_available_days && outletData.delivery_start) {
            // Backward compat: wrap flat fields as single-element array
            settingsList = [{
                delivery_available_days: outletData.delivery_available_days,
                delivery_start: outletData.delivery_start,
                delivery_end: outletData.delivery_end,
                delivery_interval: outletData.delivery_interval,
                lead_time: outletData.lead_time,
                max_order_per_slot: outletData.max_order_per_slot,
            }];
        }

        if (settingsList.length === 0) return [];

        const allSlotTimes = new Set();
        const allSlots = [];

        for (const setting of settingsList) {
            const availableDays = (setting.delivery_available_days || "")
                .split(',')
                .map(d => parseInt(d.trim()))
                .filter(n => !isNaN(n));

            if (!availableDays.includes(day)) continue;

            const { delivery_start, delivery_end, delivery_interval, lead_time } = setting;
            if (!delivery_start || !delivery_end || !delivery_interval) continue;

            const interval = parseInt(delivery_interval);
            const pickupLeadTime = parseInt(outletData.pickup_lead_time ?? 0);
            const deliveryLeadTime = parseInt(lead_time || "0");
            const leadTimeMinutes = orderType === 'pickup' ? pickupLeadTime : deliveryLeadTime;
            const minTime = new Date(now.getTime() + leadTimeMinutes * 60000);

            const [startH, startM] = delivery_start.split(':').map(Number);
            const [endH, endM] = delivery_end.split(':').map(Number);

            let current = new Date(date);
            current.setHours(startH, startM, 0, 0);

            const end = new Date(date);
            end.setHours(endH, endM, 0, 0);

            while (current < end) {
                const slotEnd = new Date(current);
                slotEnd.setMinutes(slotEnd.getMinutes() + interval);
                if (slotEnd > end) {
                    break;
                }

                if (current >= minTime) {
                    const formatSlotTime = (value) => {
                        const h = String(value.getHours()).padStart(2, '0');
                        const m = String(value.getMinutes()).padStart(2, '0');
                        return `${h}:${m}`;
                    };

                    const timeStr = formatSlotTime(current);
                    const endTimeStr = formatSlotTime(slotEnd);
                    if (!allSlotTimes.has(timeStr)) {
                        allSlotTimes.add(timeStr);
                        allSlots.push({
                            time: timeStr,
                            endTime: endTimeStr,
                            label: `${timeStr} - ${endTimeStr}`,
                            isOperate: true,
                        });
                    }
                }
                current.setMinutes(current.getMinutes() + interval);
            }
        }

        // Sort chronologically
        allSlots.sort((a, b) => a.time.localeCompare(b.time));
        return allSlots;
    };

    //initial rendering (default show today). REQ-002: anchor on MY time.
    useEffect(() => {
        if (outlet) {
            const dates = [];
            const todayMY = nowInMY().toDate();
            // Generate next 3 days
            for (let i = 0; i < 3; i++) {
                const date = new Date(todayMY);
                date.setDate(date.getDate() + i);

                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateString = formatMYDate(date);

                // Calculate slots to determine if operate
                const slots = getAvailableSlots(date, outlet);
                const isOperate = slots.length > 0;

                dates.push({
                    date,
                    dateString,
                    isOperate,
                    dayName,
                    isPartialOpen: false, // Deprecated/Not used with new logic
                    slots // Store slots for easier access
                });
            }
            setAvailableDates(dates);
        }

    }, [outlet]);

    // REQ-001: Restore selection from storage. Delegates the default-time
    // decision to generateTimesForDate (which picks ASAP when enabled, else
    // the earliest real slot). The previous version double-setState'd ASAP
    // here and overrode the earliest-slot fallback — bug fix 3.
    useEffect(() => {
        if (!availableDates || availableDates.length === 0) return;
        const firstOperationalDate = availableDates.find(d => d.isOperate)?.date;

        // Stored canonical YYYY-MM-DD HH:MM → restore that exact slot
        if (estimatedTime?.estimatedTime && estimatedTime.estimatedTime !== ASAP &&
            estimatedTime?.date && estimatedTime?.time) {
            const matchingDate = availableDates.find(d => d.dateString === estimatedTime.date);
            if (matchingDate?.isOperate === true) {
                setSelectedDate(matchingDate.date);
                generateTimesForDate(matchingDate.date);
                setSelectedDateTime(estimatedTime.estimatedTime);
                return;
            }
        }

        // Default path: select today's date row. generateTimesForDate will
        // pick ASAP if the outlet is open right now, otherwise the earliest
        // real slot. Do NOT override its decision here.
        if (firstOperationalDate) {
            setSelectedDate(firstOperationalDate);
            generateTimesForDate(firstOperationalDate);
        }
    }, [availableDates]);



    // REQ-001: Inject ASAP as the first virtual time slot when the chosen
    // date is today AND the outlet is currently open. ASAP is disabled (greyed)
    // when outlet is closed for the chosen order_type — user must pick a slot.
    const generateTimesForDate = (date) => {
        if (!outlet || !date) return;

        const slots = getAvailableSlots(date, outlet);

        // Determine if `date` is today in MY time
        const todayMY = nowInMY().toDate();
        const isToday = date.getFullYear() === todayMY.getFullYear()
            && date.getMonth() === todayMY.getMonth()
            && date.getDate() === todayMY.getDate();

        const asapEnabled = isToday && isOutletOpenNow(outlet, orderType, todayMY);
        const asapSlot = {
            time: ASAP,
            endTime: null,
            label: asapEnabled ? 'ASAP' : 'ASAP (closed)',
            isOperate: asapEnabled,
            isAsap: true,
        };

        // ASAP is always the first option for today (even when disabled, so users
        // see it). For future dates, ASAP doesn't render at all.
        const composed = isToday ? [asapSlot, ...slots] : slots;

        if (composed.length === 0) {
            setAvailableTimes([]);
            setSelectedTime(null);
            setSelectedTimeIndex(null);
            return;
        }

        setAvailableTimes(composed);

        // Default selection: ASAP if enabled, otherwise the earliest real slot.
        if (asapEnabled) {
            setSelectedTime(ASAP);
            setSelectedTimeIndex(0);
        } else {
            const firstReal = composed.find(s => s.isOperate && !s.isAsap);
            if (firstReal) {
                setSelectedTime(firstReal.time);
                setSelectedTimeIndex(composed.indexOf(firstReal));
            } else {
                setSelectedTime(null);
                setSelectedTimeIndex(null);
            }
        }
    };

    // REQ-001: Restore the time selection from storage. ASAP is recognized as
    // the canonical sentinel and matches the virtual ASAP slot if present.
    useEffect(() => {
        if (!availableTimes || availableTimes.length === 0) return;

        // Stored ASAP → select ASAP slot if it exists and is enabled
        if (estimatedTime?.estimatedTime === ASAP) {
            const asapIdx = availableTimes.findIndex(t => t.isAsap && t.isOperate);
            if (asapIdx !== -1) {
                setSelectedTime(ASAP);
                setSelectedTimeIndex(asapIdx);
                return;
            }
        }

        // Stored "HH:MM" → match real slot
        if (estimatedTime?.time) {
            const estIndex = availableTimes.findIndex(t => t.time === estimatedTime.time && !t.isAsap);
            if (estIndex !== -1) {
                setSelectedTime(estimatedTime.time);
                setSelectedTimeIndex(estIndex);
                return;
            }
        }
        // Otherwise leave whatever generateTimesForDate already chose
    }, [availableTimes]);




    const renderEmptyTime = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No time selection for this date.</Text>
            <Text style={styles.emptySubText}>Please pick another day or outlet.</Text>
        </View>
    );

    return (
        <Modal
            visible={showDateTimePicker}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowDateTimePicker(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Desire Time</Text>
                    {noticeMessage ? (
                        <View style={styles.noticeContainer}>
                            <Text style={styles.noticeText}>{noticeMessage}</Text>
                        </View>
                    ) : null}

                    {/* Date Picker */}
                    <Text style={styles.sectionTitle}>Date</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} onWheel={(e) => {
                        if (e.deltaY !== 0) {
                            e.preventDefault(); // prevent page scroll
                            e.currentTarget.scrollLeft += e.deltaY; // make vertical scroll move horizontally
                        }
                    }}>
                        {availableDates.map((dateObj, index) => {

                            const actualDate = dateObj.date;
                            const isOperating = dateObj.isOperate;
                            const dayName = actualDate.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNumber = actualDate.getDate();
                            const month = actualDate.toLocaleDateString('en-US', { month: 'short' });
                            const isSelected = selectedDate &&
                                actualDate.getDate() === selectedDate.getDate() &&
                                actualDate.getMonth() === selectedDate.getMonth();

                            // const isOperational = isDateOperational(date);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.dateOption, isSelected && styles.selectedOption]}
                                    onPress={() => {
                                        if (isOperating) {
                                            updateNoticeMessage('');
                                            setSelectedDate(actualDate);
                                            generateTimesForDate(actualDate);
                                        }
                                    }}
                                    disabled={!isOperating}
                                >
                                    {/* , !isOperating && styles.disabledText */}
                                    <Text style={[styles.dateText, isSelected && styles.selectedText, !isOperating && styles.disabledText]}>{dayName}</Text>
                                    <Text style={[styles.dateNumber, isSelected && styles.selectedText, !isOperating && styles.disabledText]}>{dayNumber}</Text>
                                    <Text style={[styles.dateText, isSelected && styles.selectedText, !isOperating && styles.disabledText]}>{month}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Time Picker */}
                    <Text style={styles.sectionTitle}>Time</Text>
                    <ScrollView style={{ maxHeight: height * 0.2 }} contentContainerStyle={styles.timeContainer}>
                        {availableTimes.length === 0 ? renderEmptyTime() : availableTimes.map((timeObj, index) => {
                            const time = timeObj.time;
                            const isOperating = timeObj.isOperate;
                            const isSelected = index === selectedTimeIndex;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.timeOption, isSelected && styles.selectedOption]}
                                    onPress={() => {
                                        if (isOperating) {
                                            updateNoticeMessage('');
                                            setSelectedTime(time);
                                            setSelectedTimeIndex(index);
                                        }
                                    }}
                                    nestedScrollEnabled={true}
                                    disabled={!isOperating}
                                >
                                    <Text style={[styles.timeText, isSelected && styles.selectedText, !isOperating && styles.disabledText]}>
                                        {timeObj.label || time}
                                    </Text>
                                </TouchableOpacity>

                            );
                        })}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.modalButtons}>
                        {/* <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowDateTimePicker(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity> */}
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!selectedDate || !selectedTime) && styles.disabledOption
                            ]}
                            disabled={!selectedDate || !selectedTime}
                            onPress={async () => {
                                // REQ-001: ASAP and scheduled-slot share one validate+persist path.
                                const isAsap = selectedTime === ASAP;
                                const selectedDateValue = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
                                const dateStr = formatMYDate(selectedDateValue);
                                const candidate = isAsap
                                    ? { estimatedTime: ASAP, date: null, time: null }
                                    : {
                                        estimatedTime: `${dateStr} ${selectedTime}`,
                                        date: dateStr,
                                        time: selectedTime,
                                    };

                                const validation = validateStoredOrderDateTime({
                                    orderType,
                                    estimatedTime: candidate,
                                    outlet,
                                    now: nowInMY().toDate(),
                                });

                                if (!validation.isValid) {
                                    updateNoticeMessage(validation.message);
                                    generateTimesForDate(selectedDateValue);
                                    return;
                                }

                                await persistEstimatedTime(isAsap ? ASAP : 'slot');
                                updateNoticeMessage('');
                                setShowDateTimePicker(false);
                            }}
                        >
                            <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                    {(!selectedDate || !selectedTime) && (
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    router.replace('/(tabs)')
                                    setShowDateTimePicker(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Back to home</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        width: Math.min(440, width) * 0.9,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C2000E',
        marginBottom: 20,
        textAlign: 'center',
    },
    noticeContainer: {
        backgroundColor: '#FFF2E2',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F4B5B9',
    },
    noticeText: {
        color: '#9B1C23',
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 10,
    },
    dateOption: {
        width: 70,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginRight: 10,
        padding: 8,
    },
    selectedOption: {
        backgroundColor: '#C2000E',
    },
    dateText: {
        fontSize: 14,
        color: '#333',
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 4,
    },
    selectedText: {
        color: 'white',
    },
    timeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        // maxHeight: height * 0.2,
        paddingBottom: 10
        // margingBottom: height * 0.2
    },
    timeOption: {
        width: width <= 360 ? '45%' : '45%',
        padding: 12,
        margin: 5,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        alignItems: 'center',
    },
    timeText: {
        fontSize: 14,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 10,
    },
    confirmButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#C2000E',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    disabledOption: {
        backgroundColor: '#F5F5F5',
        opacity: 0.5,
    },
    disabledText: {
        color: '#999',
    },
    closedText: {
        fontSize: 14,
        color: '#C2000E',
        textAlign: 'center',
        width: '100%',
        marginTop: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Route159-Bold',
        color: '#C2000E',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        fontFamily: 'Route159-Regular',
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
});
