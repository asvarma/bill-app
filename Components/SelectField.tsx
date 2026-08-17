import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export default function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  error,
  required,
}: SelectFieldProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, search]);

  function openModal() {
    setSearch('');
    setVisible(true);
  }

  function selectOption(option: SelectOption) {
    onValueChange(option.value);
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.asterisk}> *</Text> : null}
      </Text>
      <Pressable style={[styles.field, error ? styles.fieldError : null]} onPress={openModal}>
        <Text style={selectedOption ? styles.valueText : styles.placeholderText} numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${label.toLowerCase()}`}
              placeholderTextColor={colors.placeholder}
              autoFocus
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              style={styles.optionList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.optionRow, item.value === value ? styles.optionRowSelected : null]}
                  onPress={() => selectOption(item)}
                >
                  <Text style={[styles.optionText, item.value === value ? styles.optionTextSelected : null]}>
                    {item.label}
                  </Text>
                  {item.value === value ? <Text style={styles.checkmark}>✓</Text> : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No matches.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyBold,
    color: colors.ink,
    marginBottom: spacing.xs + 2,
  },
  asterisk: {
    color: colors.amberDark,
  },
  field: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  valueText: {
    flex: 1,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
  },
  placeholderText: {
    flex: 1,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyRegular,
    color: colors.placeholder,
  },
  chevron: {
    fontSize: fontSize.xxl,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.primary,
  },
  searchInput: {
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  optionList: {
    flexGrow: 0,
  },
  optionRow: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  optionRowSelected: {
    backgroundColor: colors.primarySurface,
  },
  optionText: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.primaryDark,
    fontFamily: fontFamily.bodySemiBold,
  },
  checkmark: {
    fontSize: fontSize.xl,
    color: colors.primaryDark,
    fontFamily: fontFamily.bodyBold,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
  },
});
