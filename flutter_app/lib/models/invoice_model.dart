import 'package:cloud_firestore/cloud_firestore.dart';
import 'job_card_model.dart';

class InvoiceModel {
  String id;
  String jobCardId;
  String customerName;
  String vehicleNumber;
  String vehicleModel;
  List<PartUsed> partsUsed;
  String? servicesDone;
  double partsTotal;
  double serviceCharge;
  double subtotal;
  double tax;
  double total;
  DateTime? createdAt;
  String? createdBy;

  InvoiceModel({
    required this.id,
    required this.jobCardId,
    required this.customerName,
    required this.vehicleNumber,
    required this.vehicleModel,
    this.partsUsed = const [],
    this.servicesDone,
    required this.partsTotal,
    required this.serviceCharge,
    required this.subtotal,
    required this.tax,
    required this.total,
    this.createdAt,
    this.createdBy,
  });

  factory InvoiceModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return InvoiceModel(
      id: doc.id,
      jobCardId: data['job_card_id'] ?? '',
      customerName: data['customer_name'] ?? '',
      vehicleNumber: data['vehicle_number'] ?? '',
      vehicleModel: data['vehicle_model'] ?? '',
      partsUsed: (data['parts_used'] as List<dynamic>?)
          ?.map((part) => PartUsed.fromMap(part as Map<String, dynamic>))
          .toList() ?? [],
      servicesDone: data['services_done'],
      partsTotal: (data['partsTotal'] ?? 0).toDouble(),
      serviceCharge: (data['serviceCharge'] ?? 0).toDouble(),
      subtotal: (data['subtotal'] ?? 0).toDouble(),
      tax: (data['tax'] ?? 0).toDouble(),
      total: (data['total'] ?? 0).toDouble(),
      createdAt: data['created_at'] != null 
          ? (data['created_at'] as Timestamp).toDate()
          : null,
      createdBy: data['created_by'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'job_card_id': jobCardId,
      'customer_name': customerName,
      'vehicle_number': vehicleNumber,
      'vehicle_model': vehicleModel,
      'parts_used': partsUsed.map((part) => part.toMap()).toList(),
      'services_done': servicesDone,
      'partsTotal': partsTotal,
      'serviceCharge': serviceCharge,
      'subtotal': subtotal,
      'tax': tax,
      'total': total,
      'created_at': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
      'created_by': createdBy,
    };
  }

  InvoiceModel copyWith({
    String? id,
    String? jobCardId,
    String? customerName,
    String? vehicleNumber,
    String? vehicleModel,
    List<PartUsed>? partsUsed,
    String? servicesDone,
    double? partsTotal,
    double? serviceCharge,
    double? subtotal,
    double? tax,
    double? total,
    DateTime? createdAt,
    String? createdBy,
  }) {
    return InvoiceModel(
      id: id ?? this.id,
      jobCardId: jobCardId ?? this.jobCardId,
      customerName: customerName ?? this.customerName,
      vehicleNumber: vehicleNumber ?? this.vehicleNumber,
      vehicleModel: vehicleModel ?? this.vehicleModel,
      partsUsed: partsUsed ?? this.partsUsed,
      servicesDone: servicesDone ?? this.servicesDone,
      partsTotal: partsTotal ?? this.partsTotal,
      serviceCharge: serviceCharge ?? this.serviceCharge,
      subtotal: subtotal ?? this.subtotal,
      tax: tax ?? this.tax,
      total: total ?? this.total,
      createdAt: createdAt ?? this.createdAt,
      createdBy: createdBy ?? this.createdBy,
    );
  }
}