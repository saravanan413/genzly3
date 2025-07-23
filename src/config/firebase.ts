
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZK3qtN0QDIp58ydNU9EZKnEQElOq0YtY",
  authDomain: "genzly.firebaseapp.com",
  projectId: "genzly",
  storageBucket: "genzly.firebasestorage.app",
  messagingSenderId: "258142953440",
  appId: "1:258142953440:web:adb42fbb7a297ecfb21585",
  measurementId: "G-LXY0MPSTLT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Security rules helper
export const validateUserAccess = (userId: string, targetUserId: string): boolean => {
  return userId === targetUserId;
};

// Message content sanitizer
export const sanitizeMessage = (content: string): string => {
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .trim();
};

export default app;
