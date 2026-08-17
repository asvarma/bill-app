import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize } from '../Theme/theme';

export default function LineItemEntryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Line Item Entry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { fontSize: fontSize.xl, fontFamily: fontFamily.bodyRegular, color: colors.textSecondary },
});
