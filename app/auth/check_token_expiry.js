import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function useAuthGuard() {
    const router = useRouter();

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                router.replace('/screens/auth/login');
                return;
            }
            try {
                const decoded = jwtDecode(token);
                const now = Date.now() / 1000;
                if (decoded.exp && decoded.exp < now) {
                    await AsyncStorage.clear();
                    router.replace('/screens/auth/login');
                }
            } catch {
                await AsyncStorage.clear();
                router.replace('/screens/auth/login');
            }
        };
        checkToken();
    }, []);
}