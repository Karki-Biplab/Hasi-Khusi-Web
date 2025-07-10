import 'package:cloud_firestore/cloud_firestore.dart';

class PartUsed {
  String productId;
  int quantity;

  PartUsed({
    required this.productId,
    required this.quantity,
  });

  factory PartUsed.fromMap(Map<String, dynamic> map) {
    return PartUsed(
      productId: map['product_id'] ?? '',
      quantity: map['qty'] ?? 0,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'product_id': productId,
      'qty': quantity,
    };
  }
}

class JobCardModel {
  String id;
  String customerName;
  String vehicleNumber;
  String vehicleModel;
  String issue;
  String? servicesDone;
  String status;
  List<PartUsed> partsUsed;
  DateTime? createdAt;
  String? createdBy;
  String? verifiedBy;
  String? approvedBy;

  JobCardModel({
    required this.id,
    required this.customerName,
    required this.vehicleNumber,
    required this.vehicleModel,
    required this.issue,
    this.servicesDone,
    this.status = 'pending',
    this.partsUsed = const [],
    this.createdAt,
    this.createdBy,
    this.verifiedBy,
    this.approvedBy,
  });

  factory JobCardModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return JobCardModel(
      id: doc.id,
      customerName: data['customer_name'] ?? '',
      vehicleNumber: data['vehicle_number'] ?? '',
      vehicleModel: data['vehicle_model'] ?? '',
      issue: data['issue'] ?? '',
      servicesDone: data['services_done'],
      status: data['status'] ?? 'pending',
      partsUsed: (data['parts_used'] as List<dynamic>?)
          ?.map((part) => PartUsed.fromMap(part as Map<String, dynamic>))
          .toList() ?? [],
      createdAt: data['created_at'] != null 
          ? (data['created_at'] as Timestamp).toDate()
          : null,
      createdBy: data['created_by'],
      verifiedBy: data['verified_by'],
      approvedBy: data['approved_by'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'customer_name': customerName,
      'vehicle_number': vehicleNumber,
      'vehicle_model': vehicleModel,
      'issue': issue,
      'services_done': servicesDone,
      'status': status,
      'parts_used': partsUsed.map((part) => part.toMap()).toList(),
      'created_at': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
      'created_by': createdBy,
      'verified_by': verifiedBy,
      'approved_by': approvedBy,
    };
  }

  String get statusDisplayName {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'verified':
        return 'Verified';
      case 'approved':
        return 'Approved';
      case 'invoiced':
        return 'Invoiced';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }

  JobCardModel copyWith({
    String? id,
    String? customerName,
    String? vehicleNumber,
    String? vehicleModel,
    String? issue,
    String? servicesDone,
    String? status,
    List<PartUsed>? partsUsed,
    DateTime? createdAt,
    String? createdBy,
    String? verifiedBy,
    String? approvedBy,
  }) {
    return JobCardModel(
      id: id ?? this.id,
      customerName: customerName ?? this.customerName,
      vehicleNumber: vehicleNumber ?? this.vehicleNumber,
      vehicleModel: vehicleModel ?? this.vehicleModel,
      issue: issue ?? this.issue,
      servicesDone: servicesDone ?? this.servicesDone,
      status: status ?? this.status,
      partsUsed: partsUsed ?? this.partsUsed,
      createdAt: createdAt ?? this.createdAt,
      createdBy: createdBy ?? this.createdBy,
      verifiedBy: verifiedBy ?? this.verifiedBy,
      approvedBy: approvedBy ?? this.approvedBy,
    );
  }
}