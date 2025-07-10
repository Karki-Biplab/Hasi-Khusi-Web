import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/product_model.dart';
import '../models/job_card_model.dart';
import '../models/invoice_model.dart';
import '../models/log_model.dart';
import '../models/user_model.dart';

class DataProvider extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  List<ProductModel> _products = [];
  List<JobCardModel> _jobCards = [];
  List<InvoiceModel> _invoices = [];
  List<LogModel> _logs = [];
  List<UserModel> _users = [];

  bool _isLoading = false;
  String? _error;

  // Getters
  List<ProductModel> get products => _products;
  List<JobCardModel> get jobCards => _jobCards;
  List<InvoiceModel> get invoices => _invoices;
  List<LogModel> get logs => _logs;
  List<UserModel> get users => _users;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Products
  Future<void> fetchProducts() async {
    try {
      _isLoading = true;
      notifyListeners();

      final querySnapshot = await _firestore.collection('products').get();
      _products = querySnapshot.docs
          .map((doc) => ProductModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addProduct(ProductModel product) async {
    try {
      final docRef = await _firestore.collection('products').add(product.toMap());
      product.id = docRef.id;
      _products.add(product);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateProduct(ProductModel product) async {
    try {
      await _firestore.collection('products').doc(product.id).update(product.toMap());
      final index = _products.indexWhere((p) => p.id == product.id);
      if (index != -1) {
        _products[index] = product;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteProduct(String productId) async {
    try {
      await _firestore.collection('products').doc(productId).delete();
      _products.removeWhere((p) => p.id == productId);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Job Cards
  Future<void> fetchJobCards() async {
    try {
      _isLoading = true;
      notifyListeners();

      final querySnapshot = await _firestore
          .collection('job_cards')
          .orderBy('created_at', descending: true)
          .get();
      _jobCards = querySnapshot.docs
          .map((doc) => JobCardModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addJobCard(JobCardModel jobCard) async {
    try {
      final docRef = await _firestore.collection('job_cards').add(jobCard.toMap());
      jobCard.id = docRef.id;
      _jobCards.insert(0, jobCard);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateJobCard(JobCardModel jobCard) async {
    try {
      await _firestore.collection('job_cards').doc(jobCard.id).update(jobCard.toMap());
      final index = _jobCards.indexWhere((jc) => jc.id == jobCard.id);
      if (index != -1) {
        _jobCards[index] = jobCard;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Invoices
  Future<void> fetchInvoices() async {
    try {
      _isLoading = true;
      notifyListeners();

      final querySnapshot = await _firestore
          .collection('invoices')
          .orderBy('created_at', descending: true)
          .get();
      _invoices = querySnapshot.docs
          .map((doc) => InvoiceModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addInvoice(InvoiceModel invoice) async {
    try {
      final docRef = await _firestore.collection('invoices').add(invoice.toMap());
      invoice.id = docRef.id;
      _invoices.insert(0, invoice);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Logs
  Future<void> fetchLogs(String userRole) async {
    try {
      _isLoading = true;
      notifyListeners();

      Query query = _firestore.collection('logs').orderBy('timestamp', descending: true);

      if (userRole != 'owner') {
        // LV2 sees 48-hour history
        final twoDaysAgo = DateTime.now().subtract(const Duration(hours: 48));
        query = query.where('timestamp', isGreaterThanOrEqualTo: Timestamp.fromDate(twoDaysAgo));
      }

      final querySnapshot = await query.get();
      _logs = querySnapshot.docs
          .map((doc) => LogModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addLog(LogModel log) async {
    try {
      final docRef = await _firestore.collection('logs').add(log.toMap());
      log.id = docRef.id;
      _logs.insert(0, log);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  // Users
  Future<void> fetchUsers() async {
    try {
      _isLoading = true;
      notifyListeners();

      final querySnapshot = await _firestore.collection('users').get();
      _users = querySnapshot.docs
          .map((doc) => UserModel.fromFirestore(doc))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Analytics helpers
  Map<String, dynamic> getDashboardStats() {
    final totalRevenue = _invoices.fold<double>(0, (sum, invoice) => sum + invoice.total);
    final lowStockCount = _products.where((p) => p.quantity <= 10).length;
    final completedJobs = _jobCards.where((jc) => jc.status == 'completed').length;
    final pendingJobs = _jobCards.where((jc) => jc.status == 'pending').length;

    return {
      'totalProducts': _products.length,
      'totalJobCards': _jobCards.length,
      'totalInvoices': _invoices.length,
      'totalRevenue': totalRevenue,
      'completedJobs': completedJobs,
      'pendingJobs': pendingJobs,
      'lowStockCount': lowStockCount,
    };
  }
}