import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDate, toLocalISODate } from '../Services/format';
import { colors, fontFamily, fontSize, minTouchTarget, radius, spacing } from '../Theme/theme';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
}

export default function DatePickerField({ label, value, onChange, placeholder = 'Any' }: DatePickerFieldProps) {
  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: value ?? new Date(),
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          onChange(selectedDate);
        }
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="compact"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              onChange(selectedDate);
            }
          }}
        />
      ) : (
        <Pressable style={styles.field} onPress={openAndroidPicker}>
          <Text style={value ? styles.valueText : styles.placeholderText}>
            {value ? formatDate(toLocalISODate(value)) : placeholder}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  field: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  valueText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textPrimary,
  },
  placeholderText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.placeholder,
  },
});
