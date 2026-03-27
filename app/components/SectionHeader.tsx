import { View, Text, StyleSheet } from "react-native";
import type { Section, Language } from "../lib/types";

interface Props {
  section: Section;
  visibleLanguages: Set<Language>;
  fontSize: number;
}

export function SectionHeader({ section, visibleLanguages, fontSize }: Props) {
  const hasTitle =
    (section.titleHy && visibleLanguages.has("hy")) ||
    (section.titleTranslit && visibleLanguages.has("translit")) ||
    (section.titleEn && visibleLanguages.has("en"));

  if (!hasTitle) return null;

  return (
    <View style={styles.container}>
      {section.titleHy && visibleLanguages.has("hy") && (
        <Text style={[styles.title, { fontSize: fontSize + 1 }]}>
          {section.titleHy}
        </Text>
      )}
      {section.titleTranslit && visibleLanguages.has("translit") && (
        <Text
          style={[styles.titleTranslit, { fontSize: fontSize - 1 }]}
        >
          {section.titleTranslit}
        </Text>
      )}
      {section.titleEn && visibleLanguages.has("en") && (
        <Text style={[styles.titleEn, { fontSize }]}>
          {section.titleEn}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  title: {
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  titleTranslit: {
    fontStyle: "italic",
    color: "#444",
    marginBottom: 2,
  },
  titleEn: {
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
