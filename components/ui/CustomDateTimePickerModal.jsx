import { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Modal, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../app/constant/constants';

const { width, height } = Dimensions.get('window');

export default function CustomDateTimePickerModal({ showDateTimePicker = false, setShowDateTimePicker, setSelectedDateTime = null, outletId }) {

    // const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [isToday, setIsToday] = useState(false);
    const [outlet, setOutlet] = useState(null);
    const [authToken, setAuthToken] = useState("");
    const [exceptionTimes, setExceptionTimes] = useState([]);
    const [partialOpenDate, setPartialOpenDate] = useState(null);
    const [estimatedTime, setEstimatedtime] = useState({});
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(null);

    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                setAuthToken(authToken);
            } catch (err) {
                console.log(err);
            }
        };

        checkStoredData();


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
        if (authToken && outletId) {
            // console.log(outletId);
            fetchOutlets();
        }
    }, [authToken, outletId])

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
                        'Authorization': `Bearer ${authToken}`,
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
        // console.log(formatted);
        if (selectedTime === "ASAP") {
            combinedValue = `${selectedTime}`;
        }
        else {
            if (isToday) {
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
            let selectedDate = new Date();

            if (dayLabel.toLowerCase() === "today") {
                const [hours, minutes] = timeString.split(":").map(Number);
                selectedDate.setHours(hours);
                selectedDate.setMinutes(minutes);
                selectedDate.setSeconds(0);
                selectedDate.setMilliseconds(0);

                const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

                if (selectedDate > oneHourFromNow) {
                    // Construct full date-time string: "YYYY-MM-DD HH:MM"
                    const yyyy = selectedDate.getFullYear();
                    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
                    const dd = String(selectedDate.getDate()).padStart(2, "0");
                    const hh = String(selectedDate.getHours()).padStart(2, "0");
                    const min = String(selectedDate.getMinutes()).padStart(2, "0");
                    finalDate = `${yyyy}-${mm}-${dd}`;
                    finalTime = `${hh}:${min}`;
                }
            } else {
                // If not 'today', assume already a valid full time string
                finalDate = convertToDateTimeString(selectedDateTime)[0];
                finalTime = convertToDateTimeString(selectedDateTime)[1];
            }
        }

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

    //initial rendering (defualt show today)
    useEffect(() => {
        if (outlet) {
            const dates = [];
            const now = new Date();

            // Check if current time is past today's operating hours
            let shouldExcludeToday = false;

            // Get today's day name
            const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });
            const formattedTodayName = todayName.charAt(0).toUpperCase() + todayName.slice(1).toLowerCase();
            const todaySchedule = outlet.operating_schedule?.[formattedTodayName];

            if (todaySchedule?.is_operated) {
                // Find the latest end time for today
                const operatingPeriods = todaySchedule.operating_hours || [];
                if (operatingPeriods.length > 0) {
                    const latestEndTime = operatingPeriods.reduce((latest, period) => {
                        const [endHour, endMinute] = period.end_time.split(':').map(Number);
                        return endHour > latest.hour ||
                            (endHour === latest.hour && endMinute > latest.minute) ?
                            { hour: endHour, minute: endMinute } : latest;
                    }, { hour: 0, minute: 0 });

                    // Compare with current time
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();

                    shouldExcludeToday = currentHour > latestEndTime.hour ||
                        (currentHour === latestEndTime.hour &&
                            currentMinute >= latestEndTime.minute);
                }
            }

            for (let i = shouldExcludeToday ? 1 : 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateString = date.toISOString().split('T')[0];
                dates.push({ date, dateString, isOperate: !isDayClosed(date), dayName, isPartialOpen: isPartialOpen(date) });
                // console.log({ date, dateString, isOperate: !isDayClosed(date), dayName, isPartialOpen: isPartialOpen(date) });
            }
            // console.log(dates);
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
                    setSelectedDate(firstOperationalDate);
                    generateTimesForDate(firstOperationalDate);
                    getSelectedDateTime();
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

    const isDayClosed = (date) => {

        const checkDate = new Date(date);
        const yyyyMmDd = checkDate.toISOString().split('T')[0];


        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

        // Check if outlet is normally closed this day
        const operatingDay = outlet.operating_schedule?.[formattedDayName];
        if (operatingDay?.is_operated === false) return true;

        // Get ALL exceptions for this date
        const exceptions = outlet.exceptions?.filter(ex => ex.date === yyyyMmDd) || [];
        // if (exceptions.length === 0) return false;

        // Get all normal operating periods
        const normalPeriods = operatingDay?.operating_hours || [];
        if (normalPeriods.length === 0) return true;

        if (normalPeriods.length === 1 && normalPeriods[0].start_time === normalPeriods[0].end_time) return true;

        if (normalPeriods.length > 1 && exceptions.length === 1) {
            const firstPeriod = normalPeriods[0];
            const lastPeriod = normalPeriods[normalPeriods.length - 1];

            // Check if exception spans all periods (start of first to end of last)
            if (exceptions[0].start_time === firstPeriod.start_time &&
                exceptions[0].end_time === lastPeriod.end_time) {
                return true; // Considered full-day closure
            }
        }

        // Check if ALL normal periods are covered by exceptions
        return normalPeriods.every(normalPeriod => {
            return exceptions.some(exception =>
                exception.start_time === normalPeriod.start_time &&
                exception.end_time === normalPeriod.end_time
            );
        });
    };

    const isPartialOpen = (date) => {

        const checkDate = new Date(date);
        const yyyyMmDd = checkDate.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

        const operatingDay = outlet.operating_schedule?.[formattedDayName];

        const exceptions = outlet.exceptions?.filter(ex => ex.date === yyyyMmDd) || [];
        if (exceptions.length === 0) return false;

        // console.log(exceptions);

        const normalPeriods = operatingDay.operating_hours || [];
        if (normalPeriods.length === 0) return true;

        // console.log(normalPeriods);

        const allCovered = normalPeriods.every(normalPeriod =>
            exceptions.some(ex =>
                ex.start_time === normalPeriod.start_time &&
                ex.end_time === normalPeriod.end_time
            )
        );

        const isPartiallyClosed = normalPeriods.some(normalPeriod => {
            const [nsH, nsM] = normalPeriod.start_time.split(':').map(Number);
            const [neH, neM] = normalPeriod.end_time.split(':').map(Number);
            const normalStart = nsH * 60 + nsM;
            const normalEnd = neH * 60 + neM;

            return exceptions.some(ex => {
                const [esH, esM] = ex.start_time.split(':').map(Number);
                const [eeH, eeM] = ex.end_time.split(':').map(Number);
                const exStart = esH * 60 + esM;
                const exEnd = eeH * 60 + eeM;

                return exStart > normalStart && exEnd < normalEnd;
            });
        });

        return isPartiallyClosed && !allCovered;
    }

    const generateTimeForExceptions = (exception) => {

        const date = new Date(exception.date);
        const times = [];
        const now = new Date();
        const [startHour, startMinute] = exception.start_time.split(':').map(Number);
        const [endHour, endMinute] = exception.end_time.split(':').map(Number);

        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        setIsToday(isToday);

        let start = new Date(date);
        start.setHours(startHour, startMinute, 0, 0);

        const end = new Date(date);
        end.setHours(endHour, endMinute, 0, 0);

        while (start < end) {
            const hour = start.getHours().toString().padStart(2, '0');
            const minutes = start.getMinutes().toString().padStart(2, '0');
            times.push(`${hour}:${minutes}`);

            start.setMinutes(start.getMinutes() + 30);
        }

        // const finalTimes = isToday ? ['ASAP', ...times] : times;
        // setExceptionTimes(times);
        return times;
    }

    const generateTimesForDate = (date) => {
        console.log(date)
        const dateStringToFind = new Date(date).toISOString().split('T')[0];
        const dayObj = availableDates.find(d => d.dateString === dateStringToFind);

        if (outlet) {
            if (dayObj && dayObj.isOperate && !dayObj.isPartialOpen) { //normal day
                const dayName = dayObj.dayName;
                const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
                const operatingDay = outlet.operating_schedule?.[formattedDayName];
                const normalPeriods = operatingDay.operating_hours || [];
                console.log(formattedDayName);
                console.log(outlet);
                console.log(operatingDay);
                let finalTimes = [];
                for (const [index, period] of normalPeriods.entries()) {
                    const times = [];
                    const now = new Date();
                    // const startHour = period.start_time;
                    // const endHour = period.end_time;

                    const [startHour, startMinute] = period.start_time.split(':').map(Number);
                    const [endHour, endMinute] = period.end_time.split(':').map(Number);

                    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    setIsToday(isToday);

                    let start = new Date(date);
                    start.setHours(startHour, startMinute, 0, 0);

                    const end = new Date(date);
                    end.setHours(endHour, endMinute, 0, 0);

                    if (isToday) {
                        // Add 1-hour buffer
                        now.setHours(now.getHours() + 1);

                        // Round to next 30-min slot
                        const roundedMinutes = now.getMinutes() <= 30 ? 30 : 0;
                        const roundedHour = roundedMinutes === 0 ? now.getHours() + 1 : now.getHours();

                        start.setHours(roundedHour, roundedMinutes, 0, 0);

                        // Ensure it's not earlier than 10:00 AM
                        const startOperation = new Date(date);
                        startOperation.setHours(startHour, 0, 0, 0);
                        if (start < startOperation) start = startOperation;
                        // console.log(startOperation);
                    }

                    while (start < end) {
                        const hour = start.getHours().toString().padStart(2, '0');
                        const minutes = start.getMinutes().toString().padStart(2, '0');
                        // times.push(`${hour}:${minutes}`);
                        times.push({ time: `${hour}:${minutes}`, isOperate: true });
                        start.setMinutes(start.getMinutes() + 30);
                    }

                    // finalTimes = index === 0 && isToday ? ['ASAP', ...finalTimes, ...times] : [...finalTimes, ...times];
                    // if (index === 0 && isToday) {
                    //     finalTimes.push('ASAP', ...times);
                    // } else {
                    //     finalTimes.push(...times);
                    // }
                    
                    const currentTime = new Date();
                    const [firstStartHour, firstStartMinute] = normalPeriods[0].start_time.split(':').map(Number);
                    const firstStart = new Date(date);
                    firstStart.setHours(firstStartHour, firstStartMinute, 0, 0);
                    const isWithinAnyOperatingPeriod = normalPeriods.some(period => {
                        const [startHour, startMinute] = period.start_time.split(':').map(Number);
                        const [endHour, endMinute] = period.end_time.split(':').map(Number);
                        
                        const periodStart = new Date(date);
                        periodStart.setHours(startHour, startMinute, 0, 0);
                        
                        const periodEnd = new Date(date);
                        periodEnd.setHours(endHour, endMinute, 0, 0);
                        
                        return currentTime >= periodStart && currentTime <= periodEnd;
                    });

                    // Use this instead of isAfterFirstStart
                    finalTimes = index === 0 && isToday && isWithinAnyOperatingPeriod
                        ? [{ time: 'ASAP', isOperate: true }, ...finalTimes, ...times]
                        : [...finalTimes, ...times];
                }
                console.log(finalTimes);
                // finalTimes = isToday ? ['ASAP', ...finalTimes] : finalTimes;

                setAvailableTimes(finalTimes);

                // if (estimatedTime.time) {
                //     const estTimeObj = finalTimes.find(time => time.time === estimatedTime.time);
                //     // setSelectedDateTime(estTimeObj.time);
                //     setSelectedTime(estTimeObj.time);
                // }
                // else {
                //     setSelectedTime(finalTimes[0].time);
                // }

                setSelectedTime(finalTimes[0]?.time ? finalTimes[0]?.time : null);
            }
            else if (dayObj && dayObj.isOperate && dayObj.isPartialOpen) { //partial open

                const exceptionObjArray = outlet.exceptions?.filter(ex => ex.date === dayObj.dateString) || [];
                for (const exception of exceptionObjArray) {
                    setExceptionTimes((prev) => [...prev, ...generateTimeForExceptions(exception)]);
                    setPartialOpenDate(dayObj);
                    // console.log("Run exception");
                }

            }
        }
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


    useEffect(() => {
        if (exceptionTimes && partialOpenDate) {
            // console.log("Run exception");
            const date = partialOpenDate.date;
            const dayName = partialOpenDate.dayName;
            let finalTimes = [];
            const formattedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
            const operatingDay = outlet.operating_schedule?.[formattedDayName];
            const normalPeriods = operatingDay.operating_hours || [];

            // console.log(normalPeriods);
            let isCurrentTimeException = false;

            for (const [index, period] of normalPeriods.entries()) {
                const times = [];
                const now = new Date();

                const [startHour, startMinute] = period.start_time.split(':').map(Number);
                const [endHour, endMinute] = period.end_time.split(':').map(Number);

                const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                setIsToday(isToday);

                let start = new Date(date);
                start.setHours(startHour, startMinute, 0, 0);

                const end = new Date(date);
                end.setHours(endHour, endMinute, 0, 0);

                if (isToday) {
                    // Add 1-hour buffer
                    now.setHours(now.getHours() + 1);

                    // Round to next 30-min slot
                    const roundedMinutes = now.getMinutes() <= 30 ? 30 : 0;
                    const roundedHour = roundedMinutes === 0 ? now.getHours() + 1 : now.getHours();

                    start.setHours(roundedHour, roundedMinutes, 0, 0);

                    const [exStartHour] = exceptionTimes[0].split(':').map(Number);
                    const [exEndHour] = exceptionTimes[exceptionTimes.length - 1].split(':').map(Number);

                    isCurrentTimeException = Number(roundedHour) >= Number(exStartHour) && (Number(roundedHour) <= Number(exEndHour));

                    // Ensure it's not earlier than 10:00 AM
                    const startOperation = new Date(date);
                    startOperation.setHours(startHour, 0, 0, 0);
                    if (start < startOperation) start = startOperation;
                    // console.log(startOperation);
                }

                while (start < end) {
                    const hour = start.getHours().toString().padStart(2, '0');
                    const minutes = start.getMinutes().toString().padStart(2, '0');
                    const timeStr = `${hour}:${minutes}`;
                    // times.push(timeStr);
                    times.push({
                        time: timeStr,
                        isOperate: !exceptionTimes.includes(timeStr) // False if in exceptions
                    });
                    start.setMinutes(start.getMinutes() + 30);
                }

                finalTimes = index === 0 && isToday && !isCurrentTimeException ? [{ time: 'ASAP', isOperate: true }, ...finalTimes, ...times] : [...finalTimes, ...times];
            }

            setAvailableTimes(finalTimes);

            // const firstOperationalDate = finalTimes.find(d => d.isOperate)?.date;

            // if (estimatedTime.estimatedTime) {
            //     setSelectedDateTime(estimatedTime.estimatedTime);
            // }
            // else {
            //     // Find first operational date if available
            //     const firstOperationalDate = availableDates.find(d => d.isOperate)?.date;
            //     if (firstOperationalDate) {
            //         setSelectedDate(firstOperationalDate);
            //     }
            // }

            setSelectedTime(finalTimes[0]?.time ? finalTimes[0]?.time : null);
        }
    }, [exceptionTimes, partialOpenDate])

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
                            style={styles.confirmButton}
                            onPress={() => {
                                // Handle the selected date and time
                                getSelectedDateTime();
                                // console.log(`Selected: ${selectedDate.toDateString()} at ${selectedTime}`);
                                setShowDateTimePicker(false);
                            }}
                        >
                            <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
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