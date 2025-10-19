import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function useAuthGuard() {
    const router = useRouter();

    const clearAuthState = async () => {
        await AsyncStorage.multiRemove([
            'authToken',
            'customerData',
            'orderType',
            'outletDetails',
            'deliveryAddressDetails',
            'estimatedTime',
            'paymentMethod',
        ]);
    };

    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                router.replace('/screens/auth/login');
                return;
            }

            try {
                const segments = token.split('.');
                if (Platform.OS !== 'web' && segments.length === 3) {
                    const decoded = jwtDecode(token);
                    const now = Date.now() / 1000;
                    if (decoded.exp && decoded.exp < now) {
                        await clearAuthState();
                        router.replace('/screens/auth/login');
                    }
                }
            } catch {
                await clearAuthState();
                router.replace('/screens/auth/login');
            }
        };
        checkToken();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
