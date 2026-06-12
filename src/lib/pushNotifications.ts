import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

let isInitialized = false;

export const savePushToken = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!profile) return;

    await PushNotifications.register();

    await new Promise<void>((resolve) => {
      PushNotifications.addListener('registration', async (token) => {

        try {
          localStorage.setItem('fcm_token', token.value);

          await (supabase as any)
            .from('push_tokens')
            .upsert(
              {
                profile_id: profile.id,
                token: token.value,
                platform: 'android',
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'token',
              }
            );

        } catch (err) {
          console.error('❌ Error saving token:', err);
        }

        resolve();
      });
    });
  } catch (err) {
    console.error('❌ Error in savePushToken:', err);
  }
};

export const removePushToken = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const token = localStorage.getItem('fcm_token');

    if (!token) return;

    await (supabase as any)
      .from('push_tokens')
      .delete()
      .eq('token', token);

    localStorage.removeItem('fcm_token');

  } catch (err) {
    console.error('Error removing token:', err);
  }
};

export const initPushNotifications = async () => {
  console.log('🚀 initPushNotifications called');

  if (!Capacitor.isNativePlatform()) return;

  if (isInitialized) return;
  isInitialized = true;

  try {
    const pushPermission =
      await PushNotifications.requestPermissions();

    if (pushPermission.receive !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    await LocalNotifications.requestPermissions();

    await LocalNotifications.createChannel({
      id: 'codonyx_notifications',
      name: 'Codonyx Notifications',
      description: 'Codonyx Push Notifications',
      importance: 5,
      visibility: 1,
    });

    await savePushToken();

    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification) => {
        console.log('Notification received:', notification);

        if (!notification.title && !notification.body) return;

        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: notification.title ?? 'Codonyx',
                body: notification.body ?? '',
                schedule: {
                  at: new Date(Date.now() + 100),
                },
              },
            ],
          });
        } catch (err) {
          console.error(
            'Error showing local notification:',
            err
          );
        }
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log(
          'Notification tapped:',
          action.notification
        );
      }
    );

  } catch (err) {
    console.error(
      'Error initializing push notifications:',
      err
    );
  }
};