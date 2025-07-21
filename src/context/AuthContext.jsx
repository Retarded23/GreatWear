import { useState, useEffect } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { AuthContext } from "./UseAuth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../services/firebase";
import toast from "react-hot-toast";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      await initializeUser(user);
    });
    return () => unsubscribe();
  }, []);

  const initializeUser = async (user) => {
    setLoading(true);
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user is banned
          if (userData.banned) {
            toast.error("Your account has been banned. Please contact support.");
            await signOut(auth);
            setCurrentUser(null);
            setUserLoggedIn(false);
            setLoading(false);
            return;
          }
          
          const userObj = {
            uid: user.uid,
            email: user.email,
            ...userData,
          };
          setCurrentUser(userObj);
          setUserLoggedIn(true);
        } else {
          toast.error("User profile not found in Firestore, Try again later.");
          setCurrentUser(null);
          setUserLoggedIn(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data. Please try again later.");
        setCurrentUser(null);
        setUserLoggedIn(false);
      }
    } else {
      setCurrentUser(null);
      setUserLoggedIn(false);
    }
    setLoading(false);
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const { email, password, ...additionalData } = userData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userProfileData = {
        email: user.email,
        ...additionalData,
        points: 100,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), userProfileData);
      const userObj = {
        uid: user.uid,
        email: user.email,
        ...userProfileData,
      };
      setCurrentUser(userObj);
      setUserLoggedIn(true);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user is banned before allowing login
        if (userData.banned) {
          await signOut(auth); // Sign out immediately
          toast.error("Your account has been banned. Please contact support.");
          throw new Error("Account is banned");
        }
        
        const userObj = {
          uid: user.uid,
          email: user.email,
          ...userData,
        };
        setCurrentUser(userObj);
        setUserLoggedIn(true);
      } else {
        toast.error("User document not found in Firestore, Try again later.");
        throw new Error("User document not found");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const googleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // Create user profile in Firestore
        const userProfileData = {
          email: user.email,
          name: user.displayName || "",
          points: 100,
          isAdmin: false,
          createdAt: new Date().toISOString(),
          avatar: user.photoURL || "",
        };
        await setDoc(userRef, userProfileData);
      }
      // Initialize user state
      await initializeUser(user);
      toast.success("Signed in with Google!");
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);
      setCurrentUser(null);
      setUserLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPoints = async (pointsChange, reason = "") => {
    console.log(`Attempting to update points: ${pointsChange}, reason: ${reason}`);
    console.log(`Current user points: ${currentUser?.points}`);
    
    if (!currentUser) {
      console.error("No current user found for points update");
      return false;
    }

    const newPoints = currentUser.points + pointsChange;
    console.log(`Calculated new points: ${newPoints}`);
    
    // Prevent negative points
    if (newPoints < 0) {
      console.log("Points would be negative, rejecting transaction");
      toast.error("Insufficient points for this transaction");
      return false;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      
      console.log("Updating database with new points:", newPoints);
      // Update database first
      await updateDoc(userDocRef, {
        points: newPoints,
        lastPointsUpdate: new Date().toISOString(),
        lastPointsReason: reason
      });
      
      // Update local state after successful database update
      try {
        const updatedUser = {
          ...currentUser,
          points: newPoints,
          lastPointsUpdate: new Date().toISOString(),
          lastPointsReason: reason
        };
        setCurrentUser(updatedUser);
        
      } catch (stateError) {
        console.error("Error updating local state:", stateError);
        
        // Even if local state fails, the database was updated successfully
        // Try a simpler state update
        try {
          setCurrentUser(prev => ({ ...prev, points: newPoints }));
          
        } catch (fallbackError) {
          console.error("Fallback state update also failed:", fallbackError);
          // As a last resort, refresh from database
          
          await refreshUserPointsFromDB();
        }
      }
      
      // Show success message
      try {
        if (pointsChange > 0) {
          toast.success(`+${pointsChange} points earned! ${reason}`);
        } else {
          toast.info(`${Math.abs(pointsChange)} points spent. ${reason}`);
        }
        
      } catch (toastError) {
        console.error("Error showing toast:", toastError);
        // Toast error shouldn't affect the return value
      }
      
      
      return true;
    } catch (error) {
      
      console.error("Error message:", error.message);
      
      
      // Try to provide more specific error messages
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check your account status.");
      } else if (error.code === 'not-found') {
        toast.error("User account not found. Please try logging in again.");
      } else {
        toast.error("Failed to update points. Please try again.");
      }
      return false;
    }
  };

  const checkSufficientPoints = (requiredPoints) => {
    if (!currentUser) return false;
    return currentUser.points >= requiredPoints;
  };

  const refreshUserPoints = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser({ ...currentUser, points: userData.points });
      }
    } catch (error) {
      console.error("Error refreshing points:", error);
    }
  };

  // Alternative function to refresh points from database
  const refreshUserPointsFromDB = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser(prev => ({ ...prev, points: userData.points }));
        console.log("Points refreshed from database:", userData.points);
      }
    } catch (error) {
      console.error("Error refreshing points from database:", error);
    }
  };

  const value = {
    currentUser,
    userLoggedIn,
    setCurrentUser,
    signup,
    login,
    logout,
    loading,
    googleSignIn,
    updateUserPoints,
    checkSufficientPoints,
    refreshUserPoints,
  
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};