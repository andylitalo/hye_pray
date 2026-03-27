import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SQLiteProvider } from "expo-sqlite";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { AppStateProvider } from "../lib/context";

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SQLiteProvider
        databaseName="hye_pray.db"
        assetSource={{
          assetId: require("../assets/hye_pray.db"),
          forceOverwrite: false,
        }}
        useSuspense={false}
      >
        <AppStateProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(drawer)" />
            <Stack.Screen
              name="service/[id]"
              options={{ headerShown: true, title: "" }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: "modal",
                headerShown: true,
                title: "Settings",
              }}
            />
          </Stack>
        </AppStateProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
