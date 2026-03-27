import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppState } from "../../lib/context";
import { SectionHeader } from "../../components/SectionHeader";
import { ChunkView } from "../../components/ChunkView";
import type { Service, SectionWithChunks } from "../../lib/types";

export default function ServiceReaderScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    services,
    todayServiceIndex,
    visibleLanguages,
    layoutMode,
    abbreviationTier,
    fontSize,
    advanceToNextService,
    getSectionsWithChunks,
    setTodayServiceIndex,
  } = useAppState();

  const [serviceId, setServiceId] = useState(params.id);
  const [groups, setGroups] = useState<SectionWithChunks[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const service = services.find((s) => s.id === serviceId);
  const serviceIndex = services.findIndex((s) => s.id === serviceId);
  const hasNext = serviceIndex < services.length - 1;
  const nextService =
    hasNext && serviceIndex >= 0 ? services[serviceIndex + 1] : null;

  useEffect(() => {
    if (serviceId) {
      setLoading(true);
      getSectionsWithChunks(serviceId).then((result) => {
        setGroups(result);
        setLoading(false);
      });
    }
  }, [serviceId, abbreviationTier, getSectionsWithChunks]);

  const handleNextService = useCallback(() => {
    if (nextService) {
      setTodayServiceIndex(serviceIndex + 1);
      setServiceId(nextService.id);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [nextService, serviceIndex, setTodayServiceIndex]);

  if (!service) {
    return (
      <View style={styles.loading}>
        <Text>Service not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: service.titleEn,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Pressable onPress={() => router.push("/settings")}>
                <Ionicons name="options-outline" size={22} color="#333" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.crossSymbol}>☩</Text>
          {visibleLanguages.has("hy") && (
            <Text style={[styles.headerHy, { fontSize: fontSize + 2 }]}>
              {service.titleHy}
            </Text>
          )}
          {visibleLanguages.has("translit") && (
            <Text
              style={[styles.headerTranslit, { fontSize }]}
            >
              {service.titleTranslit}
            </Text>
          )}
          {visibleLanguages.has("en") && (
            <Text style={[styles.headerEn, { fontSize: fontSize + 2 }]}>
              {service.titleEn}
            </Text>
          )}
          <View style={styles.divider} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          groups.map((group) => (
            <View key={group.section.id} style={styles.sectionGroup}>
              <SectionHeader
                section={group.section}
                visibleLanguages={visibleLanguages}
                fontSize={fontSize}
              />
              {group.chunks.map((chunk) => (
                <ChunkView
                  key={chunk.id}
                  chunk={chunk}
                  visibleLanguages={visibleLanguages}
                  layoutMode={layoutMode}
                  fontSize={fontSize}
                />
              ))}
              <View style={styles.sectionDivider} />
            </View>
          ))
        )}

        {hasNext && nextService && !loading && (
          <Pressable style={styles.nextButton} onPress={handleNextService}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Continue to Next Service</Text>
              <Text style={styles.nextName}>{nextService.titleEn}</Text>
            </View>
            <Ionicons
              name="arrow-forward-circle"
              size={28}
              color="#fff"
            />
          </Pressable>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", paddingVertical: 20 },
  crossSymbol: { fontSize: 32, color: "#999", marginBottom: 8 },
  headerHy: { fontWeight: "500", textAlign: "center", marginBottom: 4 },
  headerTranslit: {
    fontStyle: "italic",
    textAlign: "center",
    color: "#555",
    marginBottom: 4,
  },
  headerEn: { fontWeight: "600", textAlign: "center", marginBottom: 8 },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    width: "80%",
    marginTop: 8,
  },
  sectionGroup: { marginBottom: 8 },
  sectionDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  nextLabel: { fontSize: 17, fontWeight: "600", color: "#fff" },
  nextName: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 2 },
});
