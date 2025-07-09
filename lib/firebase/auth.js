import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    if (!userData) {
      // If user doesn't exist in Firestore, check if it's one of our demo users
      const demoUsers = {
        'owner@workshop.com': { role: 'owner', name: 'Workshop Owner' },
        'admin@workshop.com': { role: 'lv2', name: 'Admin User' },
        'worker@workshop.com': { role: 'lv1', name: 'Worker User' }
      };
      
      const demoUser = demoUsers[email];
      if (demoUser) {
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: demoUser.name,
          email: email,
          role: demoUser.role,
          created_at: serverTimestamp()
        });
        
        return {
          uid: user.uid,
          email: user.email,
          role: demoUser.role,
          name: demoUser.name
        };
      } else {
        throw new Error('User profile not found. Please contact administrator.');
      }
    }
    
    return {
      uid: user.uid,
      email: user.email,
      role: userData.role || 'lv1',
      name: userData.name || 'User'
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'auth/configuration-not-found') {
      throw new Error('Firebase configuration error. Please check your setup.');
    } else {
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};