import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { IDGenerator } from '../utils/idGenerator';
import { NotificationManager } from '../utils/notifications';

// Products
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(doc.data().created_at)
    }));
    
    // Check for low stock and send notifications
    NotificationManager.checkLowStock(products);
    
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    // Generate custom product ID
    const customId = await IDGenerator.generateProductId(productData.category);
    
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      customId,
      created_at: serverTimestamp()
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    await updateDoc(doc(db, 'products', id), {
      ...productData,
      updated_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, 'products', id));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Job Cards
export const getJobCards = async () => {
  try {
    const q = query(collection(db, 'job_cards'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      parts_used: Array.isArray(doc.data().parts_used) ? doc.data().parts_used : [],
      created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(doc.data().created_at)
    }));
  } catch (error) {
    console.error('Error fetching job cards:', error);
    throw error;
  }
};

export const addJobCard = async (jobCardData) => {
  try {
    // Generate custom job card ID
    const customId = await IDGenerator.generateJobCardId();
    
    const docRef = await addDoc(collection(db, 'job_cards'), {
      ...jobCardData,
      customId,
      status: 'pending',
      created_at: serverTimestamp()
    });
    
    // Send notification for new job card
    const createdByDoc = await getDoc(doc(db, 'users', jobCardData.created_by));
    const createdByName = createdByDoc.exists() ? createdByDoc.data().name : 'Unknown User';
    
    await NotificationManager.notifyNewJobCard({
      ...jobCardData,
      id: docRef.id,
      customId
    }, createdByName);
    
    return { id: docRef.id };
  } catch (error) {
    console.error('Error adding job card:', error);
    throw error;
  }
};

export const updateJobCard = async (id, jobCardData) => {
  try {
    // Get the current job card data
    const currentJobCard = await getDoc(doc(db, 'job_cards', id));
    const currentData = currentJobCard.data();
    
    await updateDoc(doc(db, 'job_cards', id), {
      ...jobCardData,
      updated_at: serverTimestamp()
    });
    
    // Send notifications based on status changes
    if (jobCardData.status && jobCardData.status !== currentData.status) {
      const updatedJobCard = { ...currentData, ...jobCardData, id };
      
      switch (jobCardData.status) {
        case 'verified':
          await NotificationManager.notifyJobVerified(updatedJobCard);
          break;
        case 'approved':
          await NotificationManager.notifyJobApproved(updatedJobCard);
          break;
        case 'completed':
          await NotificationManager.notifyJobCompletion(updatedJobCard);
          break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating job card:', error);
    throw error;
  }
};

// Invoices
export const getInvoices = async () => {
  try {
    const q = query(collection(db, 'invoices'), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      parts_used: Array.isArray(doc.data().parts_used) ? doc.data().parts_used : [],
      created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : new Date(doc.data().created_at)
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

export const addInvoice = async (invoiceData) => {
  try {
    // Generate custom invoice ID
    const customId = await IDGenerator.generateInvoiceId(invoiceData.created_by);
    
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoiceData,
      customId,
      created_at: serverTimestamp()
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error adding invoice:', error);
    throw error;
  }
};

// Logs
export const addLog = async (logData) => {
  try {
    const docRef = await addDoc(collection(db, 'logs'), {
      ...logData,
      timestamp: serverTimestamp()
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error adding log:', error);
    throw error;
  }
};

export const getLogs = async (userRole) => {
  try {
    let q;
    
    if (userRole !== 'owner') {
      // LV2 sees 48-hour history
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
      const twoDaysAgoTimestamp = Timestamp.fromDate(twoDaysAgo);
      
      q = query(
        collection(db, 'logs'), 
        where('timestamp', '>=', twoDaysAgoTimestamp),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
    }));
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};

// Users
export const getUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    // Generate custom user ID based on role
    const customId = await IDGenerator.generateUserId(userData.role);
    
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      customId,
      created_at: serverTimestamp()
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    await updateDoc(doc(db, 'users', id), {
      ...userData,
      updated_at: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, 'users', id));
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};