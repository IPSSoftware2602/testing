import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkoutClearStorage = async () => {
    const keysToRemove = [
        'estimatedTime',
        'deliveryAddressDetails',
        'orderType',
        'outletDetails',
        'paymentMethod'
    ];

    try {
        // const currentStorage = await AsyncStorage.multiGet(keysToRemove);
        // console.log('Current storage before clear:', currentStorage);

        // Perform the removal
        await AsyncStorage.multiRemove(keysToRemove);

        // Verify removal was successful
        const clearedStorage = await AsyncStorage.multiGet(keysToRemove);
        const wereCleared = clearedStorage.every(([_, value]) => value === null);

        if (!wereCleared) {
            console.error('Failed to clear these keys:',
                clearedStorage.filter(([_, value]) => value !== null)
            );
            throw new Error('Storage clearance failed');
        }

        // console.log('Storage cleared successfully');
        return true;
    } catch (err) {
        console.error('Clearance error:', err);
        return false;
    }
};

export default function useCheckValidOrderType() {
    useEffect(() => {
        const checkOrderType = async () => {
            const orderType = await AsyncStorage.getItem('orderType');
            const outletDetails = await AsyncStorage.getItem('outletDetails');
            const deliveryAddressDetails = await AsyncStorage.getItem('deliveryAddressDetails');

            if (
                orderType &&
                (
                    (
                        (orderType === "pickup" || orderType === "dinein") && !outletDetails
                    ) ||
                    (
                        orderType === "delivery" && !deliveryAddressDetails
                    )
                )
            ) {
                await checkoutClearStorage();
            }
        };
        checkOrderType();
    }, []);

}
