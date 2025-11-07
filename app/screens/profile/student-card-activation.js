import { Image, ScrollView, StyleSheet, Text, View, Dimensions, TextInput, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavigation from '../../../components/ui/TopNavigation';
import { useRouter } from 'expo-router';
import { commonStyles, fonts, colors } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';
import { useState, useEffect } from 'react';
import DateSelector from '../../../components/ui/DateSelector';
import FileUploader from '../../../components/ui/FileUploader';
import { CustomCheckbox } from '../../../components/ui/CustomCheckBox';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthGuard from '../../auth/check_token_expiry';

const { width, height } = Dimensions.get('window');

export default function StudentCardActivation() {
    useAuthGuard();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [studentName, setStudentName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [institution, setInstitution] = useState("");
    const [graduationDate, setGraduationDate] = useState(new Date().toISOString().split('T')[0]);
    const [studentIdPicture, setStudentIdPicture] = useState(null);
    const [checkedTnC, setCheckedTnC] = useState(false);
    const [customerData, setCustomerData] = useState(null);
    const [authToken, setAuthToken] = useState("");
    const toast = useToast();



    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                const customerJson = await AsyncStorage.getItem('customerData');
                const customerData = customerJson ? JSON.parse(customerJson) : null;

                // if (!customerData) {
                //     router.push('/screens/auth/login');
                // }
                setAuthToken(authToken);
                setCustomerData(customerData);
            } catch (err) {
                console.log(err);
                // router.push('/screens/auth/login');
            }
        };

        checkStoredData();
    }, [router])

    function dataURItoBlob(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeString });
    }

    const handleRegister = async () => {
        const formData = new FormData();

        if (studentIdPicture) {
            if (Platform.OS === "web") {
                // On web: convert blob
                const res = await fetch(studentIdPicture.uri);
                const blob = await res.blob();
                formData.append(
                    "profile_picture",
                    blob,
                    studentIdPicture.name || "student_id.jpg"
                );
            } else {
                // On native: normal { uri, type, name }
                const normalizedFile = {
                    uri: studentIdPicture.uri,
                    type: studentIdPicture.mimeType || studentIdPicture.type || "image/jpeg",
                    name:
                        studentIdPicture.fileName ||
                        studentIdPicture.name ||
                        "student_id.jpg",
                };
                // console.log("Normalized file:", normalizedFile);
                formData.append("profile_picture", normalizedFile);
            }
        }

        formData.append("studentName", studentName);
        formData.append("studentId", studentId);
        formData.append("institution", institution);
        formData.append("graduationDate", graduationDate);

        try {
            const response = await axios.post(
                apiUrl + "customer/activate-student-card/" + customerData.id,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            const updateProfileData = await response.data;
            // console.log(updateProfileData);

            if (updateProfileData.status === "success") {
                toast.show("Student Card successfully submitted", {
                    type: "custom_toast",
                    data: { title: "Successfully", status: "success" },
                });
                router.replace("(tabs)");
            }
        } catch (err) {
            toast.show("Please try again", {
                type: "custom_toast",
                data: { title: "Activate Student Card Failed", status: "danger" },
            });
            if (err.response) {
                console.log("Response data:", err.response.data);
                console.log("Response status:", err.response.status);
            }
        }
    };

    return (
        <ResponsiveBackground>
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: '#FFF',
                    paddingTop: Platform.OS === 'android' ? insets.top / 0 : 0,
                }}
            >
                <TopNavigation title="STUDENT CARD" isBackButton={true} navigatePage={() => router.push('/screens/profile/student-card')} />
                <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>
                    <View style={styles.studentCardWrapper}>
                        <LinearGradient
                            colors={['#E60012', '#FFF2E2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, 0.2]}
                            style={styles.studentCard}
                        >
                            <View style={styles.studentCardContainer}>
                                <Image
                                    source={require('../../../assets/elements/profile/studentCard/uspizza-studentcard.png')}
                                    style={styles.image}
                                />
                                <Text style={styles.title}>Activate your student card to enjoy discounts</Text>
                            </View>
                        </LinearGradient>
                        {/* <View style={styles.studentCardContainer}>
                            <Image
                                source={require('../../../assets/elements/profile/studentCard/uspizza-studentcard.png')}
                                style={styles.image}
                            />
                            <Text style={styles.title}>Activate your student card to enjoy discounts!</Text>
                        </View> */}
                    </View>
                    <View style={styles.formWrapper}>
                        <View style={styles.form}>
                            <Text style={styles.formTitle}>Student Name</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Student Name"
                                placeholderTextColor="#999"
                                value={studentName}
                                onChangeText={setStudentName}
                            />
                            <Text style={styles.formTitle}>Student ID</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Student ID"
                                placeholderTextColor="#999"
                                value={studentId}
                                onChangeText={setStudentId}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formTitle}>Institution Name</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Institution Name"
                                placeholderTextColor="#999"
                                value={institution}
                                onChangeText={setInstitution}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formTitle}>Graduation Date</Text>
                            <DateSelector
                                value={graduationDate}
                                onDateChange={setGraduationDate}
                                placeholder="Select Graduation Date"
                                style={commonStyles.input}
                            />
                            <Text style={styles.formTitle}>Upload Student ID Image</Text>
                            <View style={styles.studentIdContainer}>
                                <FileUploader
                                    value={studentIdPicture}
                                    onImageChange={setStudentIdPicture}
                                    size={120}
                                    imageStyle={styles.imageUploader}
                                    showCameraIcon={false}
                                />
                            </View>

                            <View style={styles.tncContainer}>
                                <CustomCheckbox
                                    checked={checkedTnC}
                                    onPress={() => setCheckedTnC(!checkedTnC)}
                                    color="#C2000E"
                                />
                                <Text style={styles.checkboxText}>I agree to the <Text style={styles.tncText}>Terms & Conditions</Text> </Text>
                            </View>
                        </View>
                        <View style={styles.wrapper} >
                            <CustomPolygonButton
                                width={Math.min(width, 440) * 0.4}
                                label="Activate Now"
                                onPress={handleRegister}
                            ></CustomPolygonButton>
                        </View>
                    </View>



                </ScrollView>

            </SafeAreaView>
        </ResponsiveBackground >
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "relative",
        marginTop: '6%',
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
    },
    studentCard: {
        padding: 16,
        width: Math.min(width, 440),
        alignItems: 'center'
    },
    studentCardContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginVertical: '5%'
    },
    studentCardWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF2E2'
    },
    formWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',

    },
    image: {
        height: Math.min(width, 440) * 0.45 * 946 / 936,
        aspectRatio: 936 / 946,
        width: Math.min(width, 440) * 0.45,
        marginTop: '5%',
        marginBottom: '3%',
        resizeMode: 'contain',
    },
    title: {
        fontSize: 22,
        fontFamily: fonts.bold,
        color: '#C2000E',
        textAlign: 'center',
        width: Math.min(440, width) * 0.7,
    },
    formTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: '#333333',
        marginBottom: '2%',
        textAlign: 'flex-start',
        // width: '80%',
    },
    studentIdContainer: {
        alignItems: 'center',
        width: '100%'
    },
    imageUploader: {
        width: Math.min(width, 440) - 70,
        height: height * 0.15,
        borderRadius: 10,
        marginBottom: '2%',
    },
    form: {
        width: '100%',
        paddingHorizontal: '8%',
        marginVertical: '5%',
    },
    tncContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        // marginTop: 20,
        alignItems: 'center'
    },
    checkboxText: {
        color: colors.textLight,
        fontSize: 14,

    },
    tncText: {
        color: '#0a7ea4',
        fontSize: 14,

    },

}); 