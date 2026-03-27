import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppState } from "../../lib/context";

export default function HomeScreen() {
  const { ready, services, todayServiceIndex } = useAppState();
  const router = useRouter();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading prayers...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Today's Worship</Text>
      {services.map((service, index) => (
        <Pressable
          key={service.id}
          style={[
            styles.todayRow,
            index === todayServiceIndex && styles.todayRowActive,
          ]}
          onPress={() => router.push(`/service/${service.id}`)}
        >
          <Ionicons
            name={
              index <= todayServiceIndex
                ? "checkmark-circle"
                : "ellipse-outline"
            }
            size={24}
            color={index <= todayServiceIndex ? "#34c759" : "#999"}
          />
          <View style={styles.todayTextWrap}>
            <Text style={styles.todayTitle}>{service.titleEn}</Text>
            {service.timeStart && (
              <Text style={styles.todayTime}>{service.timeStart}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </Pressable>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        All Services
      </Text>
      {services.map((service) => (
        <Pressable
          key={`all-${service.id}`}
          style={styles.serviceRow}
          onPress={() => router.push(`/service/${service.id}`)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>{service.titleEn}</Text>
            <Text style={styles.serviceSubtitle}>{service.titleTranslit}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  content: { padding: 20, paddingBottom: 60 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  todayRowActive: {
    backgroundColor: "#e8f4fd",
  },
  todayTextWrap: { flex: 1 },
  todayTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  todayTime: { fontSize: 13, color: "#888", marginTop: 2 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  serviceTitle: { fontSize: 16, fontWeight: "500", color: "#1a1a1a" },
  serviceSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
});
