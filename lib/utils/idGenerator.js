import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export class IDGenerator {
  // Generate User ID based on role
  static async generateUserId(role) {
    const rolePrefix = {
      'owner': 'U_O',
      'lv2': 'U_A',    // Admin
      'lv1': 'U_W'     // Worker
    };

    const prefix = rolePrefix[role] || 'U_U';
    
    try {
      // Get the latest user with this role prefix
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('customId', '>=', prefix),
        where('customId', '<', prefix + '\uf8ff'),
        orderBy('customId', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      let nextNumber = 1;
      
      if (!querySnapshot.empty) {
        const lastUser = querySnapshot.docs[0].data();
        const lastId = lastUser.customId;
        const lastNumber = parseInt(lastId.split(prefix)[1]) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error generating user ID:', error);
      // Fallback to timestamp-based ID
      return `${prefix}${Date.now().toString().slice(-2)}`;
    }
  }

  // Generate Invoice ID with date, user ID, and incremental number
  static async generateInvoiceId(userId) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    try {
      // Get user's custom ID
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('__name__', '==', userId)
      ));
      
      let userCustomId = 'U_U01'; // Default fallback
      if (!userDoc.empty) {
        userCustomId = userDoc.docs[0].data().customId || userCustomId;
      }
      
      // Get today's invoices for this user to determine next number
      const invoicesRef = collection(db, 'invoices');
      const todayPrefix = `INV-${dateStr}-${userCustomId}`;
      
      const q = query(
        invoicesRef,
        where('customId', '>=', todayPrefix),
        where('customId', '<', todayPrefix + '\uf8ff'),
        orderBy('customId', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      let nextNumber = 1;
      
      if (!querySnapshot.empty) {
        const lastInvoice = querySnapshot.docs[0].data();
        const lastId = lastInvoice.customId;
        const lastNumber = parseInt(lastId.split('-').pop()) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `${todayPrefix}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating invoice ID:', error);
      // Fallback ID
      return `INV-${dateStr}-${userId.slice(-6)}-001`;
    }
  }

  // Generate Job Card ID
  static async generateJobCardId() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    try {
      const jobCardsRef = collection(db, 'job_cards');
      const todayPrefix = `JOB-${dateStr}`;
      
      const q = query(
        jobCardsRef,
        where('customId', '>=', todayPrefix),
        where('customId', '<', todayPrefix + '\uf8ff'),
        orderBy('customId', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      let nextNumber = 1;
      
      if (!querySnapshot.empty) {
        const lastJobCard = querySnapshot.docs[0].data();
        const lastId = lastJobCard.customId;
        const lastNumber = parseInt(lastId.split('-').pop()) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `${todayPrefix}-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating job card ID:', error);
      return `JOB-${dateStr}-${Date.now().toString().slice(-3)}`;
    }
  }

  // Generate Product ID
  static async generateProductId(category) {
    const categoryPrefix = {
      'Engine Parts': 'ENG',
      'Brake System': 'BRK',
      'Electrical': 'ELC',
      'Body Parts': 'BDY',
      'Fluids': 'FLD',
      'Tools': 'TLS'
    };

    const prefix = categoryPrefix[category] || 'GEN';
    
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('customId', '>=', prefix),
        where('customId', '<', prefix + '\uf8ff'),
        orderBy('customId', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      let nextNumber = 1;
      
      if (!querySnapshot.empty) {
        const lastProduct = querySnapshot.docs[0].data();
        const lastId = lastProduct.customId;
        const lastNumber = parseInt(lastId.replace(prefix, '')) || 0;
        nextNumber = lastNumber + 1;
      }
      
      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating product ID:', error);
      return `${prefix}${Date.now().toString().slice(-4)}`;
    }
  }
}