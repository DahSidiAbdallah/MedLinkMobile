// @ts-ignore - expo-notifications may not be installed
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    if (this.initialized) return;

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }

    // Get push token
    const token = await this.getPushToken();
    if (token) {
      await this.savePushToken(token);
    }

    this.initialized = true;
  }

  private async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
        });
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });

      return tokenData.data;
    } catch (error) {
      console.warn('Failed to get push token:', error);
      return null;
    }
  }

  private async savePushToken(token: string) {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) return;

      const db = getFirestore();
      await setDoc(doc(db, 'users', userId), {
        pushToken: token,
        platform: Platform.OS,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.warn('Failed to save push token:', error);
    }
  }

  async scheduleReminder(reminderId: string, title: string, message: string, datetime: Date) {
    try {
      // Cancel any existing notification for this reminder
      await this.cancelScheduledReminder(reminderId);

      // Schedule new notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          sound: 'default',
          data: { reminderId },
        },
        trigger: {
          date: datetime,
        },
      });

      // Save notification ID to Firestore
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (userId) {
        const db = getFirestore();
        await setDoc(doc(db, 'scheduledNotifications', `${userId}_${reminderId}`), {
          notificationId: identifier,
          reminderId,
          scheduledFor: datetime,
          createdAt: new Date(),
        });
      }

      return identifier;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return null;
    }
  }

  async cancelScheduledReminder(reminderId: string) {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (userId) {
        const db = getFirestore();
        const notificationDoc = await getDoc(doc(db, 'scheduledNotifications', `${userId}_${reminderId}`));
        
        if (notificationDoc.exists()) {
          const { notificationId } = notificationDoc.data();
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        }
      }
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
    }
  }

  async scheduleDailyMedicationReminder(medicationName: string, time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${medicationName}`,
        sound: 'default',
        data: { type: 'medication', medicationName },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  // Handle notification responses
  setupNotificationResponseHandler() {
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      const { notification } = response;
      const data = notification.request.content.data;

      if (data.reminderId) {
        // Navigate to reminder details or mark as complete
        console.log('Reminder notification tapped:', data.reminderId);
      }
    });
  }
}

export const notificationService = NotificationService.getInstance();
