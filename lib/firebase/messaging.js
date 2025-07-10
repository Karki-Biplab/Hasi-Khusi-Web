import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './config';

class NotificationService {
  constructor() {
    this.messaging = null;
    this.token = null;
    this.init();
  }

  async init() {
    try {
      this.messaging = getMessaging();
      await this.requestPermission();
      this.setupMessageListener();
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await this.getToken();
      } else {
        console.log('Notification permission denied.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  }

  async getToken() {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        this.token = token;
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
  }

  async saveTokenToDatabase(userId) {
    if (!this.token || !userId) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        fcmTokens: arrayUnion(this.token),
        lastTokenUpdate: new Date()
      });
      console.log('Token saved to database');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  setupMessageListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      
      const { title, body, icon } = payload.notification || {};
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title || 'Workshop Manager', {
            body: body || 'You have a new notification',
            icon: icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'workshop-notification',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View',
                icon: '/icons/view-icon.png'
              },
              {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss-icon.png'
              }
            ]
          });
        });
      } else {
        // Fallback for browsers without service worker
        new Notification(title || 'Workshop Manager', {
          body: body || 'You have a new notification',
          icon: icon || '/icons/icon-192x192.png'
        });
      }
    });
  }

  // Send notification to specific users based on roles
  async sendNotification(notification) {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Notification templates for different events
  getNotificationTemplate(type, data) {
    const templates = {
      LOW_STOCK: {
        title: '⚠️ Low Stock Alert',
        body: `${data.productName} is running low (${data.quantity} remaining)`,
        data: { type: 'LOW_STOCK', productId: data.productId },
        targetRoles: ['owner', 'lv2']
      },
      NEW_JOB_CARD: {
        title: '📋 New Job Card Created',
        body: `Job card for ${data.vehicleNumber} has been created by ${data.createdBy}`,
        data: { type: 'NEW_JOB_CARD', jobCardId: data.jobCardId },
        targetRoles: ['owner', 'lv2']
      },
      INVOICE_REQUEST: {
        title: '💰 Invoice Request',
        body: `${data.workerName} has requested invoice generation for job ${data.jobCardId}`,
        data: { type: 'INVOICE_REQUEST', jobCardId: data.jobCardId },
        targetRoles: ['owner']
      },
      JOB_COMPLETION: {
        title: '✅ Job Completed',
        body: `Job card ${data.jobCardId} for ${data.vehicleNumber} has been completed`,
        data: { type: 'JOB_COMPLETION', jobCardId: data.jobCardId },
        targetRoles: ['owner', 'lv2', 'lv1']
      },
      JOB_VERIFIED: {
        title: '✅ Job Verified',
        body: `Your job card ${data.jobCardId} has been verified and is ready for approval`,
        data: { type: 'JOB_VERIFIED', jobCardId: data.jobCardId },
        targetRoles: ['lv1']
      },
      JOB_APPROVED: {
        title: '🎉 Job Approved',
        body: `Job card ${data.jobCardId} has been approved and is ready for invoicing`,
        data: { type: 'JOB_APPROVED', jobCardId: data.jobCardId },
        targetRoles: ['lv2', 'lv1']
      }
    };

    return templates[type];
  }
}

export default new NotificationService();