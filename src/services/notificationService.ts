// import { store } from "@/redux/store";
// import { socketService } from "./socketService";
// import { addNotification } from "@/redux/features/notificationSlice";
// import { TNotification } from "@/types/notificationType";

// class NotificationService {
//   private unsubscribe: (() => void) | null = null;
//   private isInitialized = false;

//   initialize() {
//     if (this.isInitialized) return;

//     console.log("🔔 Initializing notification service...");
    
//     this.unsubscribe = socketService.onNotification((notification: TNotification) => {
//       this.handleNewNotification(notification);
//     });

//     this.isInitialized = true;
//     console.log("✅ Notification service initialized");
//   }

//   private handleNewNotification(notification: TNotification) {
//     console.log("🔔 Handling new notification:", notification);
    
//     store.dispatch(addNotification(notification));
    
//     this.showNotificationToast(notification);
//   }

//   private showNotificationToast(notification: TNotification) {
//     if ('Notification' in window && Notification.permission === 'granted') {
//       new Notification(notification.title, {
//         body: notification.message,
//         icon: '/notification-icon.png',
//       });
//     } else {
//       console.log('🔔 New Notification:', {
//         title: notification.title,
//         message: notification.message
//       });
//     }
//   }

//   sendMessageNotification({
//     userId,
//     userName,
//     message,
//     conversationId
//   }: {
//     userId: string;
//     userName: string;
//     message: string;
//     conversationId: string;
//   }) {
//     const notificationData = {
//       toUser: [userId],
//       title: `New message from ${userName}`,
//       message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
//       type: 'message',
//       metadata: {
//         conversationId,
//         senderName: userName
//       }
//     };

//     socketService.emit('sendNotification', notificationData);
//   }

//   cleanup() {
//     if (this.unsubscribe) {
//       this.unsubscribe();
//       this.unsubscribe = null;
//     }
//     this.isInitialized = false;
//     console.log("🧹 Notification service cleaned up");
//   }
// }

// export const notificationService = new NotificationService();