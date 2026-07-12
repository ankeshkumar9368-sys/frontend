"use client";

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export default function PushNotificationManager() {
  useEffect(() => {
    // Only run in native capacitor environment (Android/iOS)
    if (!Capacitor.isNativePlatform()) return;

    let currentUserUid: string | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUserUid = user.uid;
        registerPushNotifications(user.uid);
      } else {
        currentUserUid = null;
      }
    });

    const registerPushNotifications = async (uid: string) => {
      try {
        // Request permission
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Push notification permission not granted');
          return;
        }

        // Register with Apple / Google to receive tokens.
        await PushNotifications.register();
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    // Add listeners once
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      if (currentUserUid) {
        try {
          await updateDoc(doc(db, 'users', currentUserUid), {
            fcmToken: token.value,
          });
          console.log('FCM token updated in Firestore');
        } catch (error) {
          console.error('Failed to update FCM token in Firestore:', error);
        }
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
      // Could show an in-app toast here if needed
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      // Handle routing based on notification payload here if needed
    });

    return () => {
      unsubscribeAuth();
      PushNotifications.removeAllListeners();
    };
  }, []);

  return null;
}
