import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray300,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: COLORS.white,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => (
        <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
      )}} />
      <Tabs.Screen name="add-stops" options={{ title: 'Add Stops', tabBarIcon: ({ color, focused }) => (
        <View style={[styles.addBtn, focused && styles.addBtnActive]}>
          <Ionicons name="add" size={24} color={focused ? COLORS.white : COLORS.gray400} />
        </View>
      )}} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, focused }) => (
        <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />
      )}} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, focused }) => (
        <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
      )}} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center',
    marginTop: -4,
  },
  addBtnActive: { backgroundColor: COLORS.primary },
});