import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';
import '../services/notification_service.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(User? firebaseUser) async {
    if (firebaseUser != null) {
      try {
        final userDoc = await _firestore.collection('users').doc(firebaseUser.uid).get();
        if (userDoc.exists) {
          _user = UserModel.fromFirestore(userDoc);
          
          // Save FCM token to database
          await NotificationService.saveTokenToDatabase(firebaseUser.uid);
        } else {
          // Create user document if it doesn't exist (for demo users)
          final demoUsers = {
            'owner@workshop.com': {'role': 'owner', 'name': 'Workshop Owner'},
            'admin@workshop.com': {'role': 'lv2', 'name': 'Admin User'},
            'worker@workshop.com': {'role': 'lv1', 'name': 'Worker User'},
          };

          final demoUser = demoUsers[firebaseUser.email];
          if (demoUser != null) {
            await _firestore.collection('users').doc(firebaseUser.uid).set({
              'name': demoUser['name'],
              'email': firebaseUser.email,
              'role': demoUser['role'],
              'created_at': FieldValue.serverTimestamp(),
            });

            final newUserDoc = await _firestore.collection('users').doc(firebaseUser.uid).get();
            _user = UserModel.fromFirestore(newUserDoc);
            
            // Save FCM token to database for new user
            await NotificationService.saveTokenToDatabase(firebaseUser.uid);
          }
        }
      } catch (e) {
        _error = e.toString();
      }
    } else {
      _user = null;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await _auth.signInWithEmailAndPassword(email: email, password: password);
      return true;
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'user-not-found':
          _error = 'No account found with this email address.';
          break;
        case 'wrong-password':
          _error = 'Incorrect password.';
          break;
        case 'invalid-email':
          _error = 'Invalid email address.';
          break;
        case 'configuration-not-found':
          _error = 'Firebase configuration error. Please check your setup.';
          break;
        default:
          _error = e.message ?? 'Login failed. Please try again.';
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      await _auth.signOut();
      _user = null;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  bool hasRole(String role) {
    if (_user == null) return false;

    final roles = {
      'owner': ['owner'],
      'lv2': ['owner', 'lv2'],
      'lv1': ['owner', 'lv2', 'lv1'],
    };

    return roles[role]?.contains(_user!.role) ?? false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}