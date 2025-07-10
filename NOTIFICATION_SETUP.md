# 🔔 Push Notification & Smart ID Setup Guide

## 🚀 Features Implemented

### ✅ Push Notification System
- **Real-time notifications** for both web and mobile
- **Role-based routing** - notifications sent only to appropriate users
- **Background & foreground** message handling
- **Custom notification templates** for different events

### ✅ Smart ID Generation
- **User IDs**: U_O01 (Owner), U_A01 (Admin), U_W01 (Worker)
- **Invoice IDs**: INV-20250110-U_O01-001 (Date-UserID-Increment)
- **Job Card IDs**: JOB-20250110-001 (Date-Increment)
- **Product IDs**: ENG0001, BRK0002, etc. (Category-based)

### ✅ Notification Events
- 🔴 **Low Stock Alert** → Owner, Admin
- 📋 **New Job Card** → Owner, Admin
- 💰 **Invoice Request** → Owner only
- ✅ **Job Completion** → All roles
- ✅ **Job Verified** → Worker who created it
- 🎉 **Job Approved** → Admin, Worker

## 📱 Setup Instructions

### 1. Firebase Console Setup

#### Enable Cloud Messaging
1. Go to Firebase Console → Project Settings
2. Click **Cloud Messaging** tab
3. Generate **Web Push certificates** (VAPID key)
4. Copy the VAPID key to `.env.local`

#### Get Service Account Key
1. Go to **Project Settings → Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Extract values for `.env.local`:
   - `FIREBASE_PRIVATE_KEY_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_CLIENT_ID`

### 2. Web App Setup

#### Update Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

#### Initialize Notifications
```javascript
// Add to your main component
import NotificationService from '@/lib/firebase/messaging';

useEffect(() => {
  // Initialize notifications when user logs in
  if (user) {
    NotificationService.saveTokenToDatabase(user.uid);
  }
}, [user]);
```

### 3. Flutter App Setup

#### Add Dependencies
```yaml
# Already added to pubspec.yaml
firebase_messaging: ^14.7.10
flutter_local_notifications: ^16.3.2
```

#### Android Configuration
1. **Update `android/app/build.gradle`** (already done)
2. **Add notification icons** to `android/app/src/main/res/drawable/`
3. **Update AndroidManifest.xml** (already done)

#### Initialize in Flutter
```dart
// Already added to main.dart
await NotificationService.initialize();
```

### 4. Testing Notifications

#### Test Low Stock Alert
```javascript
// In browser console or your app
import { NotificationManager } from '@/lib/utils/notifications';

// Simulate low stock
const lowStockProducts = [
  { id: '1', name: 'Brake Pads', quantity: 5 }
];
NotificationManager.checkLowStock(lowStockProducts);
```

#### Test Job Card Notifications
```javascript
// When creating a job card
const jobCard = {
  id: 'job123',
  vehicle_number: 'KA01AB1234',
  customer_name: 'John Doe'
};
NotificationManager.notifyNewJobCard(jobCard, 'Worker Name');
```

## 🔧 How It Works

### 1. Notification Flow
```
Event Triggered → Template Generated → Role Check → Send to FCM Tokens → Display Notification
```

### 2. ID Generation Flow
```
Create Entity → Check Existing IDs → Generate Next Sequential ID → Save with Custom ID
```

### 3. Role-Based Routing
```javascript
const notification = {
  title: 'New Job Card',
  body: 'Job created for KA01AB1234',
  targetRoles: ['owner', 'lv2'] // Only owners and admins
};
```

## 📊 Smart ID Examples

### User IDs
- **Owner**: U_O01, U_O02, U_O03...
- **Admin**: U_A01, U_A02, U_A03...
- **Worker**: U_W01, U_W02, U_W03...

### Invoice IDs
- **Format**: INV-YYYYMMDD-UserID-XXX
- **Example**: INV-20250110-U_O01-001
- **Next**: INV-20250110-U_O01-002

### Job Card IDs
- **Format**: JOB-YYYYMMDD-XXX
- **Example**: JOB-20250110-001
- **Next**: JOB-20250110-002

### Product IDs
- **Engine Parts**: ENG0001, ENG0002...
- **Brake System**: BRK0001, BRK0002...
- **Electrical**: ELC0001, ELC0002...

## 🎯 Notification Targeting

### Owner Receives:
- ✅ All job updates
- ✅ Invoice requests
- ✅ Low stock alerts
- ✅ System-wide notifications

### Admin (lv2) Receives:
- ✅ New job cards
- ✅ Job completions
- ✅ Low stock alerts
- ✅ Job approvals

### Worker (lv1) Receives:
- ✅ Job verifications (their jobs)
- ✅ Job approvals
- ✅ Task assignments

## 🔍 Troubleshooting

### Web Notifications Not Working
1. Check browser permissions
2. Verify VAPID key in `.env.local`
3. Check service worker registration
4. Test in incognito mode

### Flutter Notifications Not Working
1. Check Android permissions
2. Verify `google-services.json`
3. Test on physical device
4. Check notification channel setup

### FCM Token Issues
1. Clear browser cache
2. Re-register service worker
3. Check Firebase console logs
4. Verify token saving to database

## 🚀 Production Deployment

### Security Checklist
- ✅ Secure Firebase Admin SDK keys
- ✅ Validate notification permissions
- ✅ Rate limit notification sending
- ✅ Sanitize notification content

### Performance Optimization
- ✅ Batch notifications for multiple users
- ✅ Cache FCM tokens efficiently
- ✅ Use background processing for bulk notifications
- ✅ Implement retry logic for failed sends

## 📈 Analytics & Monitoring

### Track Notification Metrics
- Delivery rates
- Open rates
- User engagement
- Error rates

### Monitor ID Generation
- Ensure sequential numbering
- Handle concurrent creation
- Backup ID generation strategy
- Audit trail for all IDs

Your workshop management system now has a complete push notification system with smart ID generation! 🎉