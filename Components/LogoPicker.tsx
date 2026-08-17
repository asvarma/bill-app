import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../Theme/theme';

interface LogoPickerProps {
  value: string | null;
  onChange: (uri: string | null) => void;
}

const LOGOS_DIR_NAME = 'business-logos';

export default function LogoPicker({ value, onChange }: LogoPickerProps) {
  const [error, setError] = useState<string | null>(null);

  async function pickLogo() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to set a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    try {
      const logosDir = new Directory(Paths.document, LOGOS_DIR_NAME);
      if (!logosDir.exists) {
        logosDir.create({ idempotent: true });
      }

      const picked = result.assets[0];
      const extension = picked.uri.split('.').pop() ?? 'jpg';
      const destination = new File(logosDir, `logo-${Date.now()}.${extension}`);

      await FileSystemLegacy.copyAsync({ from: picked.uri, to: destination.uri });

      onChange(destination.uri);
    } catch {
      setError('Could not save the selected image. Please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Business Logo</Text>
      <View style={styles.row}>
        <Pressable style={styles.preview} onPress={pickLogo}>
          {value ? (
            <Image source={{ uri: value }} style={styles.image} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={22} color={colors.inkSecondary} />
              <Text style={styles.placeholderText}>Add logo</Text>
            </>
          )}
        </Pressable>
        {value ? (
          <Pressable onPress={() => onChange(null)} style={styles.removeButton} hitSlop={8}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.uploadBorder,
    borderStyle: 'dashed',
    backgroundColor: colors.uploadBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyMedium,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  removeButton: {
    marginLeft: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodySemiBold,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.bodyRegular,
    color: colors.danger,
  },
});
