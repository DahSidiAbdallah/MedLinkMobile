import AsyncStorage from '@react-native-async-storage/async-storage';

const MEDICATIONS_KEY = 'myMedications';

export async function saveMedication(item: any) {
  const existing = await AsyncStorage.getItem(MEDICATIONS_KEY);
  const list = existing ? JSON.parse(existing) : [];
  list.push(item);
  await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(list));
}

export async function getMedications() {
  const existing = await AsyncStorage.getItem(MEDICATIONS_KEY);
  return existing ? JSON.parse(existing) : [];
}

export async function clearMedications() {
  await AsyncStorage.removeItem(MEDICATIONS_KEY);
}
