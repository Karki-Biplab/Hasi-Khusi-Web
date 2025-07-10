import 'package:cloud_firestore/cloud_firestore.dart';

class ProductModel {
  String id;
  String name;
  String category;
  int quantity;
  double unitPrice;
  String? description;
  DateTime? createdAt;
  String? lastUpdatedBy;

  ProductModel({
    required this.id,
    required this.name,
    required this.category,
    required this.quantity,
    required this.unitPrice,
    this.description,
    this.createdAt,
    this.lastUpdatedBy,
  });

  factory ProductModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ProductModel(
      id: doc.id,
      name: data['name'] ?? '',
      category: data['category'] ?? '',
      quantity: data['quantity'] ?? 0,
      unitPrice: (data['unit_price'] ?? 0).toDouble(),
      description: data['description'],
      createdAt: data['created_at'] != null 
          ? (data['created_at'] as Timestamp).toDate()
          : null,
      lastUpdatedBy: data['last_updated_by'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'category': category,
      'quantity': quantity,
      'unit_price': unitPrice,
      'description': description,
      'created_at': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
      'last_updated_by': lastUpdatedBy,
    };
  }

  double get totalValue => quantity * unitPrice;

  String get stockStatus {
    if (quantity == 0) return 'Out of Stock';
    if (quantity <= 5) return 'Critical';
    if (quantity <= 10) return 'Low Stock';
    if (quantity <= 50) return 'Medium Stock';
    return 'High Stock';
  }

  ProductModel copyWith({
    String? id,
    String? name,
    String? category,
    int? quantity,
    double? unitPrice,
    String? description,
    DateTime? createdAt,
    String? lastUpdatedBy,
  }) {
    return ProductModel(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      lastUpdatedBy: lastUpdatedBy ?? this.lastUpdatedBy,
    );
  }
}