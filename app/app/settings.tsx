import { View, Text, Switch, Pressable, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import Slider from "@react-native-community/slider";
import { useAppState } from "../lib/context";
import type { Language, AbbreviationTier, LayoutMode } from "../lib/types";
import { LANGUAGE_LABELS, TIER_LABELS, ROLE_COLORS } from "../lib/types";

const LANGUAGES: Language[] = ["hy", "translit", "en"];
const TIERS: AbbreviationTier[] = ["short", "medium", "full"];
const LAYOUTS: LayoutMode[] = ["stacked", "columns"];
const LAYOUT_LABELS: Record<LayoutMode, string> = {
  stacked: "Stacked",
  columns: "Side by Side",
};

function SegmentedControl<T extends string>({
  options,
  labels,
  selected,
  onSelect,
}: {
  options: T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={segStyles.container}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[segStyles.segment, selected === opt && segStyles.segmentActive]}
          onPress={() => onSelect(opt)}
        >
          <Text
            style={[
              segStyles.segmentText,
              selected === opt && segStyles.segmentTextActive,
            ]}
          >
            {labels[opt]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: { fontSize: 13, fontWeight: "500", color: "#666" },
  segmentTextActive: { color: "#000" },
});

export default function SettingsScreen() {
  const {
    visibleLanguages,
    layoutMode,
    abbreviationTier,
    fontSize,
    toggleLanguage,
    setLayoutMode,
    setAbbreviationTier,
    setFontSize,
  } = useAppState();

  return (
    <>
      <Stack.Screen options={{ title: "Settings", presentation: "modal" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.groupTitle}>Visible Languages</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang, i) => (
            <View key={lang}>
              {i > 0 && <View style={styles.separator} />}
              <View style={styles.row}>
                <Text style={styles.label}>{LANGUAGE_LABELS[lang]}</Text>
                <Switch
                  value={visibleLanguages.has(lang)}
                  onValueChange={() => toggleLanguage(lang)}
                  trackColor={{ true: "#34c759" }}
                />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.groupTitle}>Layout</Text>
        <View style={styles.card}>
          <SegmentedControl
            options={LAYOUTS}
            labels={LAYOUT_LABELS}
            selected={layoutMode}
            onSelect={setLayoutMode}
          />
        </View>

        <Text style={styles.groupTitle}>Abbreviation</Text>
        <View style={styles.card}>
          <SegmentedControl
            options={TIERS}
            labels={TIER_LABELS}
            selected={abbreviationTier}
            onSelect={setAbbreviationTier}
          />
          <Text style={styles.hint}>
            {abbreviationTier === "short"
              ? "Essential prayers only."
              : abbreviationTier === "medium"
              ? "Standard service with key prayers and readings."
              : "Complete service with all prayers, rubrics, and extended litanies."}
          </Text>
        </View>

        <Text style={styles.groupTitle}>Text Size</Text>
        <View style={styles.card}>
          <View style={styles.sliderRow}>
            <Text style={{ fontSize: 13 }}>A</Text>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Slider
                minimumValue={12}
                maximumValue={28}
                step={1}
                value={fontSize}
                onValueChange={setFontSize}
                minimumTrackTintColor="#007AFF"
              />
            </View>
            <Text style={{ fontSize: 22 }}>A</Text>
          </View>
          <Text style={styles.hint}>Preview: {fontSize}pt</Text>
        </View>

        <Text style={styles.groupTitle}>Role Colors</Text>
        <View style={styles.card}>
          {(
            [
              ["priest", "Priest"],
              ["deacon", "Deacon"],
              ["congregation", "Congregation"],
              ["choir", "Choir"],
              ["rubric", "Rubric"],
            ] as const
          ).map(([role, label], i) => (
            <View key={role}>
              {i > 0 && <View style={styles.separator} />}
              <View style={styles.row}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: ROLE_COLORS[role] },
                  ]}
                />
                <Text style={styles.label}>{label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f7" },
  content: { padding: 20 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
  },
  label: { fontSize: 16, color: "#1a1a1a" },
  hint: { fontSize: 13, color: "#888", marginTop: 8 },
  sliderRow: { flexDirection: "row", alignItems: "center" },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
});
