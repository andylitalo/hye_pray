import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

export default function DrawerLayout() {
  const router = useRouter();

  return (
    <Drawer
      screenOptions={{
        drawerType: "front",
        drawerStyle: { width: 300 },
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/settings")}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
          </Pressable>
        ),
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Hye Pray",
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
