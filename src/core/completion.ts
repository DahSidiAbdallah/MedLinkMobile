import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'reminder_completion_by_date'; // value shape: { [yyyy-mm-dd]: { [reminderId]: true } }

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function getDayCompletion(date = new Date()): Promise<Record<string, boolean>> {
  const k = todayKey(date);
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed[k] || {};
  } catch {
    return {};
  }
}

export async function setCompleted(reminderId: string, done: boolean, date = new Date()): Promise<void> {
  const k = todayKey(date);
  const raw = (await AsyncStorage.getItem(KEY)) || '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch {}
  if (!parsed[k]) parsed[k] = {};
  if (done) parsed[k][reminderId] = true; else delete parsed[k][reminderId];
  await AsyncStorage.setItem(KEY, JSON.stringify(parsed));
}

export async function getTodayStats(reminderIds: string[], date = new Date()): Promise<{ done: number; total: number }>{
  const map = await getDayCompletion(date);
  const total = reminderIds.length;
  const done = reminderIds.filter(id => !!map[id]).length;
  return { done, total };
}
