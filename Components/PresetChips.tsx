import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import type { TradeTemplatePreset } from '../Data/types';
import { colors, fontFamily, fontSize, radius, spacing } from '../Theme/theme';

interface PresetChipsProps {
  presets: TradeTemplatePreset[];
  onSelect: (preset: TradeTemplatePreset) => void;
}

export default function PresetChips({ presets, onSelect }: PresetChipsProps) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {presets.map((preset) => (
        <Pressable key={preset.description} style={styles.chip} onPress={() => onSelect(preset)}>
          <Text style={styles.chipText}>+ {preset.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: colors.steelSoft,
    borderWidth: 1,
    borderColor: colors.steelSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    marginRight: spacing.sm,
  },
  chipText: {
    color: colors.steelBlue,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodySemiBold,
  },
});
