# Flutter Workshop Manager Setup Instructions

## Prerequisites

1. **Flutter SDK** (3.0.0 or higher)
2. **Android Studio** with Android SDK
3. **Firebase Project** (same as your web app)

## Setup Steps

### 1. Install Flutter Dependencies

```bash
cd flutter_app
flutter pub get
```

### 2. Firebase Configuration

#### Option A: Use FlutterFire CLI (Recommended)
```bash
# Install FlutterFire CLI
dart pub global activate flutterfire_cli

# Configure Firebase for your project
flutterfire configure
```

#### Option B: Manual Configuration
1. Go to Firebase Console → Project Settings → Your apps
2. Add an Android app with package name: `com.example.workshop_manager`
3. Download `google-services.json` and place it in `android/app/`
4. Update `firebase_options.dart` with your configuration

### 3. Android Configuration

Update `android/app/build.gradle`:
- Ensure `minSdkVersion` is 21 or higher
- Add Firebase dependencies (already included)

### 4. Run the App

```bash
# Check connected devices
flutter devices

# Run on Android device/emulator
flutter run
```

## Features Included

✅ **Authentication**
- Email/Password login
- Role-based access control
- Auto-login with demo credentials

✅ **Dashboard**
- Statistics overview
- Revenue charts
- Job status distribution
- Recent activity feed

✅ **Inventory Management**
- Product CRUD operations
- Stock level monitoring
- Category filtering
- Search functionality

✅ **Job Cards**
- Create and manage job cards
- Status workflow (pending → verified → approved)
- Parts usage tracking
- Customer vehicle information

✅ **Invoices**
- Generate invoices from approved job cards
- PDF export functionality
- Tax calculations
- Payment tracking

✅ **User Management** (Owner only)
- View all users
- Role management
- User activity tracking

✅ **Activity Logs** (Admin+ only)
- Real-time activity tracking
- Filtered by user role
- Action history

## UI/UX Features

- **Material Design 3** with custom theme
- **Gradient backgrounds** and modern card designs
- **Responsive layout** for different screen sizes
- **Loading states** and error handling
- **Pull-to-refresh** functionality
- **Bottom navigation** with role-based visibility
- **Charts and analytics** using FL Chart
- **Toast notifications** for user feedback

## Architecture

- **Provider** for state management
- **Firebase** for backend services
- **Go Router** for navigation
- **Model classes** for type safety
- **Separation of concerns** with providers and models

## Demo Credentials

- **Owner**: owner@workshop.com / password123
- **Admin**: admin@workshop.com / password123
- **Worker**: worker@workshop.com / password123

## Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Ensure `google-services.json` is in the correct location
   - Verify package name matches Firebase configuration

2. **Build Errors**
   - Run `flutter clean && flutter pub get`
   - Check Android SDK and build tools are updated

3. **Authentication Issues**
   - Verify Firebase Authentication is enabled
   - Check demo users exist in Firebase Auth

### Debug Commands

```bash
# Clean build
flutter clean

# Get dependencies
flutter pub get

# Check for issues
flutter doctor

# Run with verbose logging
flutter run -v
```

## Production Deployment

1. **Update package name** in `android/app/build.gradle`
2. **Generate signed APK** for Play Store
3. **Update Firebase configuration** for production
4. **Test thoroughly** on different devices
5. **Enable Firebase security rules** for production

## Next Steps

- Add offline support with local database
- Implement push notifications
- Add image upload for products
- Integrate payment gateways
- Add barcode scanning for inventory
- Implement advanced reporting features