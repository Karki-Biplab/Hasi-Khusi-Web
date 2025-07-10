import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/configuration-not-found':
      return 'Firebase configuration error. Please check your setup.';
    default:
      return 'An error occurred. Please try again.';
  }
};

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
      name: userData.name || 'User',
      created_at: userData.created_at,
      last_login: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Enhanced signup function
export const signup = async (userData) => {
  try {
    const { email, password, name, role = 'lv1' } = userData;
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: name
    });
    
    // Create user document in Firestore
    const userDocData = {
      name,
      email,
      role,
      created_at: serverTimestamp(),
      created_by: 'self',
      status: 'active'
    };
    
    await setDoc(doc(db, 'users', user.uid), userDocData);
    
    return {
      uid: user.uid,
      email: user.email,
      name,
      role,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Password reset function
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Failed to log out');
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};