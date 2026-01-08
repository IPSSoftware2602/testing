import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Modal, Dimensions, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../app/constant/constants';

const { width, height } = Dimensions.get('window');

export default function CustomDateTimePickerModal({ showDateTimePicker = false, setShowDateTimePicker, setSelectedDateTime = null, outletId }) {
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

    useEffect(() => {

        const fetchEstimatedTime = async () => {
            try {
                const estimatedTime = await AsyncStorage.getItem('estimatedTime');
                if (estimatedTime) {
                    const parsedEstimatedTime = JSON.parse(estimatedTime);
                    // console.log(parsedEstimatedTime.estimatedTime);

                    // setSelectedDateTime(parsedEstimatedTime.estimatedTime);
                    setEstimatedtime(parsedEstimatedTime);
                }
            } catch (err) {
                console.log(err?.response?.data?.message);
            }
        }
        fetchEstimatedTime();

    }, [])

    useEffect(() => {
        if (outletId) {
            // console.log(outletId);
            fetchOutlets();
        }
    }, [outletId])

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

    const getSelectedDateTime = () => {
        const date = selectedDate;
        if (!date) return;
        const options = { month: 'short', day: 'numeric' };
        const formatted = date.toLocaleDateString('en-US', options);

        let combinedValue = "";

        // Check if selectedDate is today
        const now = new Date();
        const isSelectedToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        // console.log(formatted);
        if (selectedTime === "ASAP") {
            combinedValue = `${selectedTime}`;
        }
        else {
            if (isSelectedToday) {
                combinedValue = `Today ${selectedTime}`;
            } else {
                combinedValue = `${formatted} ${selectedTime}`;
            }

        }
        // console.log(combinedValue);
        setSelectedDateTime(combinedValue);
        handleDateTimeChange(combinedValue);
    }

    function convertToDateTimeString(input) {
        // input format: "Jul 31 14:00"
        const [monthStr, dayStr, timeStr] = input.split(" "); // "Jul", "31", "14:00"
        const [hours, minutes] = timeStr.split(":").map(Number);

        // Create a Date object using current year
        const now = new Date();
        const year = now.getFullYear();

        // Parse month string to month index (0-11)
        const monthIndex = new Date(`${monthStr} 1, ${year}`).getMonth();

        // Create date
        const date = new Date(year, monthIndex, Number(dayStr), hours, minutes);

        // Format as "YYYY-MM-DD HH:MM"
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");

        return [`${yyyy}-${mm}-${dd}`, `${hh}:${min}`];
    }

    const setEstimaedTime = async ({ estimatedTime, date, time }) => {

        let estimatedTimeDetail = {
            estimatedTime,
            date,
            time
        };
        try {
            await AsyncStorage.setItem('estimatedTime', JSON.stringify(estimatedTimeDetail));
        }
        catch (err) {
            console.log(err.response.data.message);
        }
    }

    const handleDateTimeChange = (selectedDateTime) => {
        if (!selectedDateTime) return;

        const now = new Date();
        console.log(selectedDateTime);
        // const selectedDate = new Date(selectedDateTime);

        // Format date: yyyy-mm-dd
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const dd = String(now.getDate()).padStart(2, '0');

        // Format time: hh:mm
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');

        let finalDate = `${yyyy}-${mm}-${dd}`;
        let finalTime = `${hh}:${min}`;

        if (selectedDateTime.split(" ").length > 1) {
            const [dayLabel, timeString] = selectedDateTime.split(" "); // e.g., "today", "14:00"
            const now = new Date();
            // let selectedDate = new Date(selectedDateTime);

            if (dayLabel.toLowerCase() === "today") {

                const yyyy = selectedDate.getFullYear();
                const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const dd = String(selectedDate.getDate()).padStart(2, "0");
                const hh = String(selectedDate.getHours()).padStart(2, "0");
                const min = String(selectedDate.getMinutes()).padStart(2, "0");
                finalDate = `${yyyy}-${mm}-${dd}`;
                finalTime = timeString;
            } else {
                // If not 'today', assume already a valid full time string
                finalDate = convertToDateTimeString(selectedDateTime)[0];
                finalTime = convertToDateTimeString(selectedDateTime)[1];
            }
        }
        console.log(finalDate, finalTime);
        setEstimaedTime({ estimatedTime: selectedDateTime, date: finalDate, time: finalTime });
        // router.push('/screens/orders/checkout');

        // router.push({
        //   pathname: '/screens/orders/checkout',
        //   params: {
        //     estimatedTime: selectedDateTime,
        //     date: finalDate,
        //     time: finalTime
        //   }
        // });
    };

    // Helper to calculate available slots for a given date
    const getAvailableSlots = (date, outletData) => {
        if (!outletData || !date) return [];

        // 1. Check Day of Week
        const day = date.getDay(); // 0 = Sunday
        const availableDays = (outletData.delivery_available_days || "")
            .split(',')
            .map(d => parseInt(d.trim()))
            .filter(n => !isNaN(n));

        if (!availableDays.includes(day)) return [];

        // 2. Parse Settings
        const { delivery_start, delivery_end, delivery_interval, lead_time } = outletData;
        if (!delivery_start || !delivery_end || !delivery_interval) return [];

        const interval = parseInt(delivery_interval);
        const leadTimeMinutes = parseInt(lead_time || "0");

        // 3. Calculate Min Eligible Time
        const now = new Date();
        const minTime = new Date(now.getTime() + leadTimeMinutes * 60000);

        // 4. Generate Slots
        const [startH, startM] = delivery_start.split(':').map(Number);
        const [endH, endM] = delivery_end.split(':').map(Number);

        const slots = [];
        let current = new Date(date);
        current.setHours(startH, startM, 0, 0);

        const end = new Date(date);
        end.setHours(endH, endM, 0, 0);

        // Handle case if end time < start time (cross midnight) -> not handled based on usage, assuming same day

        while (current <= end) {
            if (current >= minTime) {
                const h = String(current.getHours()).padStart(2, '0');
                const m = String(current.getMinutes()).padStart(2, '0');
                slots.push({ time: `${h}:${m}`, isOperate: true });
            }
            current.setMinutes(current.getMinutes() + interval);
        }

        return slots;
    };

    //initial rendering (default show today)
    useEffect(() => {
        if (outlet) {
            const dates = [];
            // Generate next 3 days
            for (let i = 0; i < 3; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);

                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateString = date.toISOString().split('T')[0];

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

    useEffect(() => {
        if (availableDates) {
            // console.log(availableDates);
            const firstOperationalDate = availableDates.find(d => d.isOperate)?.date;

            if (estimatedTime.estimatedTime) {
                const estimatedDate = new Date(estimatedTime?.date);
                const matchingDate = availableDates.find(d => d.dateString === estimatedTime.date);
                // console.log(matchingDate);
                if (matchingDate?.isOperate === true) {
                    setSelectedDateTime(estimatedTime.estimatedTime);
                    generateTimesForDate(estimatedDate);
                    setSelectedDate(estimatedDate);
                }
                else {
                    // setSelectedDateTime(null);
                    if (firstOperationalDate) {
                        setSelectedDate(firstOperationalDate);
                        generateTimesForDate(firstOperationalDate);
                        getSelectedDateTime();
                    }
                }
            }
            else {
                // Find first operational date if available
                if (firstOperationalDate) {
                    setSelectedDate(firstOperationalDate);
                    generateTimesForDate(firstOperationalDate);
                    getSelectedDateTime();
                }
            }

        }
    }, [availableDates]);



    const generateTimesForDate = (date) => {
        if (!outlet || !date) return;

        // Use the pre-calculated logic or re-calculate
        const slots = getAvailableSlots(date, outlet);
        console.log(slots);
        // Handle no slots
        if (slots.length === 0) {
            setAvailableTimes([]);
            setSelectedTime(null);
            return;
        }

        setAvailableTimes(slots);
        // Default select first available
        setSelectedTime(slots[0].time);
    };

    useEffect(() => {
        if (estimatedTime.time) {
            // console.log(estimatedTime.time);
            // console.log(availableTimes);
            const estTimeObj = availableTimes.find(time => time.time === estimatedTime.time);
            // setSelectedDateTime(estTimeObj.time);
            // console.log(estTimeObj);
            if (estTimeObj) {
                const estIndex = availableTimes.findIndex(t => t.time === estimatedTime.time);
                if (estIndex !== -1) {
                    setSelectedTime(estimatedTime.time);
                    setSelectedTimeIndex(estIndex);
                }
            } else {
                setSelectedTime(availableTimes[0]?.time ?? null);
                setSelectedTimeIndex(0);
            }
        }
        // else {
        //     setSelectedTime(availableTimes[0].time);
        // }
    }, [availableTimes])




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
                            // console.log(actualDate);
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
                                            setSelectedTime(time);
                                            setSelectedTimeIndex(index);
                                        }
                                    }}
                                    nestedScrollEnabled={true}
                                    disabled={!isOperating}
                                >
                                    <Text style={[styles.timeText, isSelected && styles.selectedText, !isOperating && styles.disabledText]}>{time}</Text>
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
                            onPress={() => {
                                // Handle the selected date and time
                                if (selectedTime !== 'ASAP') {
                                    const now = new Date();
                                    const [hours, minutes] = selectedTime.split(':').map(Number);
                                    const checkDate = new Date(selectedDate);
                                    checkDate.setHours(hours, minutes, 0, 0);

                                    // Add a small buffer (e.g., 1 minute) to allow for minor time differences
                                    // or just strict check. User said "not over current time".
                                    // if (checkDate < now) {
                                    // Strict check might be annoying if user takes a minute to decide.
                                    // Let's rely on strict check for now as requested.
                                    if (checkDate < now) {
                                        Alert.alert("Invalid Time", "The selected time has already passed. Please select a valid time.");
                                        // Refresh times?
                                        generateTimesForDate(selectedDate);
                                        return;
                                    }
                                }

                                getSelectedDateTime();
                                // console.log(`Selected: ${selectedDate.toDateString()} at ${selectedTime}`);
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
        width: width <= 360 ? '45%' : '30%',
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