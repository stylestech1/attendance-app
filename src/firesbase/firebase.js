import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_apiKey,
  authDomain: process.env.NEXT_PUBLIC_authDomain,
  projectId: process.env.NEXT_PUBLIC_projectId,
  storageBucket: process.env.NEXT_PUBLIC_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_appId,
  measurementId: process.env.NEXT_PUBLIC_measurementId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

export const generateFCMToken = async ()=> {
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  console.log('🔒 Permission', permission)

  if (permission === "granted") {
    try {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      console.log("FCM token:", token);
      return token;
    } catch (err) {
      console.error("FCM token generation error:", err);
      return null;
    }
  }
  return null;
};

export const listenToForegroundMessages = () => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
  });
};
