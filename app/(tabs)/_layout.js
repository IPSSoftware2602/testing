import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/ui/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home'
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu'
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market'
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Order'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profiles'
        }}
      />
    </Tabs>
  );
} 