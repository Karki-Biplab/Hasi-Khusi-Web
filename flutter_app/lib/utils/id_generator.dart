import 'package:cloud_firestore/cloud_firestore.dart';

class IDGenerator {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Generate User ID based on role
  static Future<String> generateUserId(String role) async {
    final Map<String, String> rolePrefix = {
      'owner': 'U_O',
      'lv2': 'U_A',    // Admin
      'lv1': 'U_W'     // Worker
    };

    final String prefix = rolePrefix[role] ?? 'U_U';
    
    try {
      // Get the latest user with this role prefix
      final QuerySnapshot querySnapshot = await _firestore
          .collection('users')
          .where('customId', isGreaterThanOrEqualTo: prefix)
          .where('customId', isLessThan: prefix + '\uf8ff')
          .orderBy('customId', descending: true)
          .limit(1)
          .get();
      
      int nextNumber = 1;
      
      if (querySnapshot.docs.isNotEmpty) {
        final Map<String, dynamic> lastUser = 
            querySnapshot.docs.first.data() as Map<String, dynamic>;
        final String lastId = lastUser['customId'] ?? '';
        final String numberPart = lastId.replaceFirst(prefix, '');
        final int lastNumber = int.tryParse(numberPart) ?? 0;
        nextNumber = lastNumber + 1;
      }
      
      return '$prefix${nextNumber.toString().padLeft(2, '0')}';
    } catch (error) {
      print('Error generating user ID: $error');
      // Fallback to timestamp-based ID
      return '$prefix${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
    }
  }

  // Generate Invoice ID with date, user ID, and incremental number
  static Future<String> generateInvoiceId(String userId) async {
    final DateTime today = DateTime.now();
    final String dateStr = today.toIso8601String().substring(0, 10).replaceAll('-', ''); // YYYYMMDD
    
    try {
      // Get user's custom ID
      final DocumentSnapshot userDoc = await _firestore.collection('users').doc(userId).get();
      
      String userCustomId = 'U_U01'; // Default fallback
      if (userDoc.exists) {
        final Map<String, dynamic> userData = userDoc.data() as Map<String, dynamic>;
        userCustomId = userData['customId'] ?? userCustomId;
      }
      
      // Get today's invoices for this user to determine next number
      final String todayPrefix = 'INV-$dateStr-$userCustomId';
      
      final QuerySnapshot querySnapshot = await _firestore
          .collection('invoices')
          .where('customId', isGreaterThanOrEqualTo: todayPrefix)
          .where('customId', isLessThan: todayPrefix + '\uf8ff')
          .orderBy('customId', descending: true)
          .limit(1)
          .get();
      
      int nextNumber = 1;
      
      if (querySnapshot.docs.isNotEmpty) {
        final Map<String, dynamic> lastInvoice = 
            querySnapshot.docs.first.data() as Map<String, dynamic>;
        final String lastId = lastInvoice['customId'] ?? '';
        final List<String> parts = lastId.split('-');
        if (parts.length >= 4) {
          final int lastNumber = int.tryParse(parts.last) ?? 0;
          nextNumber = lastNumber + 1;
        }
      }
      
      return '$todayPrefix-${nextNumber.toString().padLeft(3, '0')}';
    } catch (error) {
      print('Error generating invoice ID: $error');
      // Fallback ID
      return 'INV-$dateStr-${userId.substring(userId.length - 6)}-001';
    }
  }

  // Generate Job Card ID
  static Future<String> generateJobCardId() async {
    final DateTime today = DateTime.now();
    final String dateStr = today.toIso8601String().substring(0, 10).replaceAll('-', ''); // YYYYMMDD
    
    try {
      final String todayPrefix = 'JOB-$dateStr';
      
      final QuerySnapshot querySnapshot = await _firestore
          .collection('job_cards')
          .where('customId', isGreaterThanOrEqualTo: todayPrefix)
          .where('customId', isLessThan: todayPrefix + '\uf8ff')
          .orderBy('customId', descending: true)
          .limit(1)
          .get();
      
      int nextNumber = 1;
      
      if (querySnapshot.docs.isNotEmpty) {
        final Map<String, dynamic> lastJobCard = 
            querySnapshot.docs.first.data() as Map<String, dynamic>;
        final String lastId = lastJobCard['customId'] ?? '';
        final List<String> parts = lastId.split('-');
        if (parts.length >= 3) {
          final int lastNumber = int.tryParse(parts.last) ?? 0;
          nextNumber = lastNumber + 1;
        }
      }
      
      return '$todayPrefix-${nextNumber.toString().padLeft(3, '0')}';
    } catch (error) {
      print('Error generating job card ID: $error');
      return 'JOB-$dateStr-${DateTime.now().millisecondsSinceEpoch.toString().substring(10)}';
    }
  }

  // Generate Product ID
  static Future<String> generateProductId(String category) async {
    final Map<String, String> categoryPrefix = {
      'Engine Parts': 'ENG',
      'Brake System': 'BRK',
      'Electrical': 'ELC',
      'Body Parts': 'BDY',
      'Fluids': 'FLD',
      'Tools': 'TLS'
    };

    final String prefix = categoryPrefix[category] ?? 'GEN';
    
    try {
      final QuerySnapshot querySnapshot = await _firestore
          .collection('products')
          .where('customId', isGreaterThanOrEqualTo: prefix)
          .where('customId', isLessThan: prefix + '\uf8ff')
          .orderBy('customId', descending: true)
          .limit(1)
          .get();
      
      int nextNumber = 1;
      
      if (querySnapshot.docs.isNotEmpty) {
        final Map<String, dynamic> lastProduct = 
            querySnapshot.docs.first.data() as Map<String, dynamic>;
        final String lastId = lastProduct['customId'] ?? '';
        final String numberPart = lastId.replaceFirst(prefix, '');
        final int lastNumber = int.tryParse(numberPart) ?? 0;
        nextNumber = lastNumber + 1;
      }
      
      return '$prefix${nextNumber.toString().padLeft(4, '0')}';
    } catch (error) {
      print('Error generating product ID: $error');
      return '$prefix${DateTime.now().millisecondsSinceEpoch.toString().substring(9)}';
    }
  }
}