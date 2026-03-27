import { View, Text, StyleSheet } from "react-native";
import type { Chunk, Language, LayoutMode } from "../lib/types";
import { ROLE_COLORS } from "../lib/types";

interface Props {
  chunk: Chunk;
  visibleLanguages: Set<Language>;
  layoutMode: LayoutMode;
  fontSize: number;
}

export function ChunkView({
  chunk,
  visibleLanguages,
  layoutMode,
  fontSize,
}: Props) {
  const color = ROLE_COLORS[chunk.role];
  const isRubric = chunk.role === "rubric";
  const hasBg = chunk.role === "priest" || chunk.role === "deacon";

  const langs: { key: Language; text: string; style: object }[] = [];

  if (visibleLanguages.has("hy") && chunk.textHy) {
    langs.push({
      key: "hy",
      text: chunk.textHy,
      style: { fontSize, color, fontStyle: isRubric ? "italic" : "normal" },
    });
  }
  if (visibleLanguages.has("translit") && chunk.textTranslit) {
    langs.push({
      key: "translit",
      text: chunk.textTranslit,
      style: {
        fontSize: fontSize - 1,
        color: isRubric ? "#888" : "#555",
        fontStyle: "italic",
      },
    });
  }
  if (visibleLanguages.has("en") && chunk.textEn) {
    langs.push({
      key: "en",
      text: chunk.textEn,
      style: { fontSize, color, fontStyle: isRubric ? "italic" : "normal" },
    });
  }

  if (langs.length === 0) return null;

  const isColumns = layoutMode === "columns" && langs.length > 1;

  return (
    <View
      style={[
        styles.container,
        hasBg && styles.bgHighlight,
        isColumns && styles.row,
      ]}
    >
      {langs.map((lang) => (
        <Text
          key={lang.key}
          style={[lang.style, isColumns && styles.column]}
        >
          {lang.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  bgHighlight: {
    backgroundColor: "#f0f4f8",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
});
