import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSQLiteContext } from 'expo-sqlite';
import BusinessProfileForm from '../Components/BusinessProfileForm';
import type { RootStackParamList } from '../Navigation/types';
import { insertBusiness } from '../Services/database';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function BusinessProfileSetupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const db = useSQLiteContext();

  return (
    <BusinessProfileForm
      eyebrow="Step 1 of 1"
      title="Set up your business"
      subtitle="This appears on every invoice you generate."
      submitLabel="Save & Continue"
      onSubmit={async (values) => {
        await insertBusiness(db, values);
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }}
    />
  );
}
