import NotificationService from '../firebase/messaging';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export class NotificationManager {
  // Check for low stock and send notifications
  static async checkLowStock(products) {
    const lowStockProducts = products.filter(product => product.quantity <= 10);
    
    for (const product of lowStockProducts) {
      const notification = NotificationService.getNotificationTemplate('LOW_STOCK', {
        productName: product.name,
        quantity: product.quantity,
        productId: product.id
      });
      
      await this.sendRoleBasedNotification(notification);
    }
  }

  // Send notification when new job card is created
  static async notifyNewJobCard(jobCard, createdByName) {
    const notification = NotificationService.getNotificationTemplate('NEW_JOB_CARD', {
      vehicleNumber: jobCard.vehicle_number,
      createdBy: createdByName,
      jobCardId: jobCard.customId || jobCard.id
    });
    
    await this.sendRoleBasedNotification(notification);
  }

  // Send notification when invoice is requested
  static async notifyInvoiceRequest(jobCard, workerName) {
    const notification = NotificationService.getNotificationTemplate('INVOICE_REQUEST', {
      workerName: workerName,
      jobCardId: jobCard.customId || jobCard.id,
      vehicleNumber: jobCard.vehicle_number
    });
    
    await this.sendRoleBasedNotification(notification);
  }

  // Send notification when job is completed
  static async notifyJobCompletion(jobCard) {
    const notification = NotificationService.getNotificationTemplate('JOB_COMPLETION', {
      jobCardId: jobCard.customId || jobCard.id,
      vehicleNumber: jobCard.vehicle_number,
      customerName: jobCard.customer_name
    });
    
    await this.sendRoleBasedNotification(notification);
  }

  // Send notification when job is verified
  static async notifyJobVerified(jobCard) {
    const notification = NotificationService.getNotificationTemplate('JOB_VERIFIED', {
      jobCardId: jobCard.customId || jobCard.id,
      vehicleNumber: jobCard.vehicle_number
    });
    
    // Send to the worker who created the job
    await this.sendToSpecificUser(notification, jobCard.created_by);
  }

  // Send notification when job is approved
  static async notifyJobApproved(jobCard) {
    const notification = NotificationService.getNotificationTemplate('JOB_APPROVED', {
      jobCardId: jobCard.customId || jobCard.id,
      vehicleNumber: jobCard.vehicle_number
    });
    
    await this.sendRoleBasedNotification(notification);
  }

  // Send notification to users based on their roles
  static async sendRoleBasedNotification(notification) {
    try {
      const usersRef = collection(db, 'users');
      const targetRoles = notification.targetRoles;
      
      for (const role of targetRoles) {
        const q = query(usersRef, where('role', '==', role));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(async (doc) => {
          const userData = doc.data();
          if (userData.fcmTokens && userData.fcmTokens.length > 0) {
            await this.sendToTokens(notification, userData.fcmTokens);
          }
        });
      }
    } catch (error) {
      console.error('Error sending role-based notification:', error);
    }
  }

  // Send notification to specific user
  static async sendToSpecificUser(notification, userId) {
    try {
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', userId)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        if (userData.fcmTokens && userData.fcmTokens.length > 0) {
          await this.sendToTokens(notification, userData.fcmTokens);
        }
      }
    } catch (error) {
      console.error('Error sending notification to specific user:', error);
    }
  }

  // Send notification to specific FCM tokens
  static async sendToTokens(notification, tokens) {
    try {
      await NotificationService.sendNotification({
        ...notification,
        tokens: tokens
      });
    } catch (error) {
      console.error('Error sending notification to tokens:', error);
    }
  }

  // Schedule periodic low stock checks
  static startLowStockMonitoring(products, intervalMinutes = 60) {
    // Check immediately
    this.checkLowStock(products);
    
    // Set up periodic checks
    setInterval(() => {
      this.checkLowStock(products);
    }, intervalMinutes * 60 * 1000);
  }
}