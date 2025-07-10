import 'package:cloud_firestore/cloud_firestore.dart';

class LogModel {
  String id;
  String userId;
  String action;
  String details;
  DateTime? timestamp;
  String? targetId;

  LogModel({
    required this.id,
    required this.userId,
    required this.action,
    required this.details,
    this.timestamp,
    this.targetId,
  });

  factory LogModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return LogModel(
      id: doc.id,
      userId: data['user_id'] ?? '',
      action: data['action'] ?? '',
      details: data['details'] ?? '',
      timestamp: data['timestamp'] != null 
          ? (data['timestamp'] as Timestamp).toDate()
          : null,
      targetId: data['target_id'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'action': action,
      'details': details,
      'timestamp': timestamp != null ? Timestamp.fromDate(timestamp!) : FieldValue.serverTimestamp(),
      'target_id': targetId,
    };
  }

  String get actionDisplayName {
    switch (action) {
      case 'add_product':
        return 'Add Product';
      case 'update_product':
        return 'Update Product';
      case 'delete_product':
        return 'Delete Product';
      case 'create_job_card':
        return 'Create Job Card';
      case 'update_job_card':
        return 'Update Job Card';
      case 'create_invoice':
        return 'Create Invoice';
      case 'add_user':
        return 'Add User';
      case 'update_user':
        return 'Update User';
      case 'delete_user':
        return 'Delete User';
      default:
        return action;
    }
  }

  LogModel copyWith({
    String? id,
    String? userId,
    String? action,
    String? details,
    DateTime? timestamp,
    String? targetId,
  }) {
    return LogModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      action: action ?? this.action,
      details: details ?? this.details,
      timestamp: timestamp ?? this.timestamp,
      targetId: targetId ?? this.targetId,
    );
  }
}