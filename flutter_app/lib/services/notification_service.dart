import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static Future<void> initialize() async {
    // Request permission for notifications
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('User granted provisional permission');
    } else {
      print('User declined or has not accepted permission');
    }

    // Initialize local notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'workshop_notifications',
      'Workshop Notifications',
      description: 'Notifications for workshop management system',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Get initial message if app was opened from notification
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  static Future<String?> getToken() async {
    try {
      String? token = await _messaging.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }

  static Future<void> saveTokenToDatabase(String userId) async {
    try {
      String? token = await getToken();
      if (token != null) {
        await _firestore.collection('users').doc(userId).update({
          'fcmTokens': FieldValue.arrayUnion([token]),
          'lastTokenUpdate': FieldValue.serverTimestamp(),
        });
        print('Token saved to database');
      }
    } catch (e) {
      print('Error saving token to database: $e');
    }
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('Received foreground message: ${message.messageId}');
    
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null && android != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'workshop_notifications',
            'Workshop Notifications',
            channelDescription: 'Notifications for workshop management system',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
            color: Color(0xFF4F46E5),
            playSound: true,
            enableVibration: true,
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    print('Received background message: ${message.messageId}');
    // Background message handling is done by the system
  }

  static void _handleNotificationTap(RemoteMessage message) {
    print('Notification tapped: ${message.messageId}');
    
    // Navigate to appropriate screen based on notification data
    Map<String, dynamic> data = message.data;
    String? type = data['type'];
    
    switch (type) {
      case 'LOW_STOCK':
        // Navigate to inventory screen
        break;
      case 'NEW_JOB_CARD':
        // Navigate to job cards screen
        break;
      case 'INVOICE_REQUEST':
        // Navigate to invoices screen
        break;
      case 'JOB_COMPLETION':
        // Navigate to specific job card
        break;
      default:
        // Navigate to dashboard
        break;
    }
  }

  static void _onNotificationTapped(NotificationResponse response) {
    print('Local notification tapped: ${response.payload}');
    // Handle local notification tap
  }

  // Notification templates for different events
  static Map<String, dynamic> getNotificationTemplate(String type, Map<String, dynamic> data) {
    final templates = {
      'LOW_STOCK': {
        'title': '⚠️ Low Stock Alert',
        'body': '${data['productName']} is running low (${data['quantity']} remaining)',
        'data': {'type': 'LOW_STOCK', 'productId': data['productId']},
        'targetRoles': ['owner', 'lv2']
      },
      'NEW_JOB_CARD': {
        'title': '📋 New Job Card Created',
        'body': 'Job card for ${data['vehicleNumber']} has been created by ${data['createdBy']}',
        'data': {'type': 'NEW_JOB_CARD', 'jobCardId': data['jobCardId']},
        'targetRoles': ['owner', 'lv2']
      },
      'INVOICE_REQUEST': {
        'title': '💰 Invoice Request',
        'body': '${data['workerName']} has requested invoice generation for job ${data['jobCardId']}',
        'data': {'type': 'INVOICE_REQUEST', 'jobCardId': data['jobCardId']},
        'targetRoles': ['owner']
      },
      'JOB_COMPLETION': {
        'title': '✅ Job Completed',
        'body': 'Job card ${data['jobCardId']} for ${data['vehicleNumber']} has been completed',
        'data': {'type': 'JOB_COMPLETION', 'jobCardId': data['jobCardId']},
        'targetRoles': ['owner', 'lv2', 'lv1']
      },
      'JOB_VERIFIED': {
        'title': '✅ Job Verified',
        'body': 'Your job card ${data['jobCardId']} has been verified and is ready for approval',
        'data': {'type': 'JOB_VERIFIED', 'jobCardId': data['jobCardId']},
        'targetRoles': ['lv1']
      },
      'JOB_APPROVED': {
        'title': '🎉 Job Approved',
        'body': 'Job card ${data['jobCardId']} has been approved and is ready for invoicing',
        'data': {'type': 'JOB_APPROVED', 'jobCardId': data['jobCardId']},
        'targetRoles': ['lv2', 'lv1']
      }
    };

    return templates[type] ?? {};
  }

  // Send notification to specific roles
  static Future<void> sendRoleBasedNotification(Map<String, dynamic> notification) async {
    try {
      List<String> targetRoles = List<String>.from(notification['targetRoles'] ?? []);
      
      for (String role in targetRoles) {
        QuerySnapshot usersSnapshot = await _firestore
            .collection('users')
            .where('role', isEqualTo: role)
            .get();
        
        for (QueryDocumentSnapshot userDoc in usersSnapshot.docs) {
          Map<String, dynamic> userData = userDoc.data() as Map<String, dynamic>;
          List<dynamic>? fcmTokens = userData['fcmTokens'];
          
          if (fcmTokens != null && fcmTokens.isNotEmpty) {
            await _sendToTokens(notification, List<String>.from(fcmTokens));
          }
        }
      }
    } catch (e) {
      print('Error sending role-based notification: $e');
    }
  }

  // Send notification to specific tokens
  static Future<void> _sendToTokens(Map<String, dynamic> notification, List<String> tokens) async {
    try {
      // In a real app, you would send this to your backend API
      // which would use Firebase Admin SDK to send the notification
      print('Sending notification to tokens: $tokens');
      print('Notification: $notification');
    } catch (e) {
      print('Error sending notification to tokens: $e');
    }
  }

  // Check for low stock and send notifications
  static Future<void> checkLowStock(List<dynamic> products) async {
    List<dynamic> lowStockProducts = products.where((product) => 
        (product.quantity ?? 0) <= 10).toList();
    
    for (var product in lowStockProducts) {
      Map<String, dynamic> notification = getNotificationTemplate('LOW_STOCK', {
        'productName': product.name,
        'quantity': product.quantity,
        'productId': product.id
      });
      
      await sendRoleBasedNotification(notification);
    }
  }

  // Notify when new job card is created
  static Future<void> notifyNewJobCard(Map<String, dynamic> jobCard, String createdByName) async {
    Map<String, dynamic> notification = getNotificationTemplate('NEW_JOB_CARD', {
      'vehicleNumber': jobCard['vehicleNumber'],
      'createdBy': createdByName,
      'jobCardId': jobCard['customId'] ?? jobCard['id']
    });
    
    await sendRoleBasedNotification(notification);
  }

  // Notify when invoice is requested
  static Future<void> notifyInvoiceRequest(Map<String, dynamic> jobCard, String workerName) async {
    Map<String, dynamic> notification = getNotificationTemplate('INVOICE_REQUEST', {
      'workerName': workerName,
      'jobCardId': jobCard['customId'] ?? jobCard['id'],
      'vehicleNumber': jobCard['vehicleNumber']
    });
    
    await sendRoleBasedNotification(notification);
  }

  // Notify when job is completed
  static Future<void> notifyJobCompletion(Map<String, dynamic> jobCard) async {
    Map<String, dynamic> notification = getNotificationTemplate('JOB_COMPLETION', {
      'jobCardId': jobCard['customId'] ?? jobCard['id'],
      'vehicleNumber': jobCard['vehicleNumber'],
      'customerName': jobCard['customerName']
    });
    
    await sendRoleBasedNotification(notification);
  }

  // Notify when job is verified
  static Future<void> notifyJobVerified(Map<String, dynamic> jobCard) async {
    Map<String, dynamic> notification = getNotificationTemplate('JOB_VERIFIED', {
      'jobCardId': jobCard['customId'] ?? jobCard['id'],
      'vehicleNumber': jobCard['vehicleNumber']
    });
    
    // Send to the worker who created the job
    await _sendToSpecificUser(notification, jobCard['createdBy']);
  }

  // Notify when job is approved
  static Future<void> notifyJobApproved(Map<String, dynamic> jobCard) async {
    Map<String, dynamic> notification = getNotificationTemplate('JOB_APPROVED', {
      'jobCardId': jobCard['customId'] ?? jobCard['id'],
      'vehicleNumber': jobCard['vehicleNumber']
    });
    
    await sendRoleBasedNotification(notification);
  }

  // Send notification to specific user
  static Future<void> _sendToSpecificUser(Map<String, dynamic> notification, String userId) async {
    try {
      DocumentSnapshot userDoc = await _firestore.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        Map<String, dynamic> userData = userDoc.data() as Map<String, dynamic>;
        List<dynamic>? fcmTokens = userData['fcmTokens'];
        
        if (fcmTokens != null && fcmTokens.isNotEmpty) {
          await _sendToTokens(notification, List<String>.from(fcmTokens));
        }
      }
    } catch (e) {
      print('Error sending notification to specific user: $e');
    }
  }
}