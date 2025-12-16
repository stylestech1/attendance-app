importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp(__FIREBASE_CONFIG__);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🔥 Background message received:", payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "New Notification";

  const options = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "",
    icon: payload.notification?.icon || "/favicon.ico",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});
