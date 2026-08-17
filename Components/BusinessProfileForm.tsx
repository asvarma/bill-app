import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import FormInput from './FormInput';
import LogoPicker from './LogoPicker';
import PhoneNumberInput from './PhoneNumberInput';
import SelectField from './SelectField';
import { INDIAN_STATE_OPTIONS } from '../Data/indianStates';
import { tradeTemplates } from '../Data/tradeTemplates';
import type { NewBusiness } from '../Services/database';
import { isValidGSTIN } from '../Services/gst';
import { isValidIndianMobileNumber } from '../Services/validation';
import { colors, fontFamily, fontSize, radius, shadow, spacing } from '../Theme/theme';

const TRADE_OPTIONS = tradeTemplates.map((trade) => ({ label: trade.label, value: trade.key }));

const TRADE_CHIP_LABELS: Record<string, string> = {
  metal_fabrication: 'Fabrication',
  electrician: 'Electrician',
  plumber: 'Plumber',
  carpenter: 'Carpenter',
  general: 'General',
};
const TRADE_CHIPS = tradeTemplates.map((trade) => ({
  key: trade.key,
  label: TRADE_CHIP_LABELS[trade.key] ?? trade.label,
}));

interface FormErrors {
  name?: string;
  mobileNumber?: string;
  gstin?: string;
  state?: string;
  trade?: string;
}

interface BusinessProfileFormValues {
  name: string;
  mobileNumber: string;
  gstin: string;
  address: string;
  state: string;
  pincode: string;
  trade: string;
  logoUri: string | null;
}

interface BusinessProfileFormProps {
  initialValues?: Partial<BusinessProfileFormValues>;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  submitLabel: string;
  onSubmit: (values: NewBusiness) => Promise<void>;
}

export default function BusinessProfileForm({
  initialValues,
  eyebrow,
  title,
  subtitle,
  submitLabel,
  onSubmit,
}: BusinessProfileFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [mobileNumber, setMobileNumber] = useState(initialValues?.mobileNumber ?? '');
  const [gstin, setGstin] = useState(initialValues?.gstin ?? '');
  const [address, setAddress] = useState(initialValues?.address ?? '');
  const [state, setState] = useState(initialValues?.state ?? '');
  const [pincode, setPincode] = useState(initialValues?.pincode ?? '');
  const [trade, setTrade] = useState(initialValues?.trade ?? '');
  const [logoUri, setLogoUri] = useState<string | null>(initialValues?.logoUri ?? null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Business name is required.';
    }
    if (!mobileNumber.trim()) {
      nextErrors.mobileNumber = 'Mobile number is required.';
    } else if (!isValidIndianMobileNumber(mobileNumber)) {
      nextErrors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }
    if (!state) {
      nextErrors.state = 'Select your business state.';
    }
    if (!trade) {
      nextErrors.trade = 'Select your trade.';
    }
    if (gstin.trim() && !isValidGSTIN(gstin)) {
      nextErrors.gstin = 'Enter a valid 15-character GSTIN.';
    }

    return nextErrors;
  }

  async function handleSubmit() {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
        address: address.trim() ? address.trim() : null,
        state,
        pincode: pincode.trim() ? pincode.trim() : null,
        logoUri,
        trade,
      });
    } catch {
      setSubmitError('Could not save your business profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <LogoPicker value={logoUri} onChange={setLogoUri} />

        <FormInput
          label="Business Name"
          required
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="e.g. NewStar Fabrication Works"
        />

        <PhoneNumberInput
          label="Mobile Number"
          required
          value={mobileNumber}
          onChangeText={setMobileNumber}
          error={errors.mobileNumber}
        />

        <FormInput
          label="GSTIN"
          optional
          value={gstin}
          onChangeText={(text) => setGstin(text.toUpperCase())}
          error={errors.gstin}
          placeholder="e.g. 27ABCDE1234F1Z5"
          autoCapitalize="characters"
          maxLength={15}
        />

        <FormInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Shop / plot no., street, city, pincode"
          multiline
          numberOfLines={3}
          style={styles.multiline}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <SelectField
              label="State"
              required
              value={state}
              onValueChange={setState}
              options={INDIAN_STATE_OPTIONS}
              placeholder="Select state"
              error={errors.state}
            />
          </View>
          <View style={styles.halfField}>
            <FormInput
              label="Pincode"
              value={pincode}
              onChangeText={(text) => setPincode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="e.g. 400001"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <SelectField
          label="Trade"
          required
          value={trade}
          onValueChange={setTrade}
          options={TRADE_OPTIONS}
          placeholder="Select your trade"
          error={errors.trade}
        />

        <View style={styles.chipRow}>
          {TRADE_CHIPS.map((chip) => {
            const selected = trade === chip.key;
            return (
              <Pressable
                key={chip.key}
                style={[styles.chip, selected ? styles.chipSelected : null]}
                onPress={() => setTrade(chip.key)}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

        <Button label={submitLabel} onPress={handleSubmit} loading={submitting} style={styles.button} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bodyBold,
    color: colors.amberDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm - 2,
  },
  title: {
    fontSize: 21,
    fontFamily: fontFamily.headingBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.xs,
    marginBottom: 18,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  chipSelected: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  chipText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  submitError: {
    color: colors.danger,
    fontSize: fontSize.base,
    fontFamily: fontFamily.bodyRegular,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    ...shadow.card,
  },
});
