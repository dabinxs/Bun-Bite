import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AuthMode = "intro" | "login" | "register";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobile?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  mobileNumber?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authModalOpen: boolean;
  authMode: AuthMode;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  requireAuth: (action: () => void) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfileData: (data: Partial<Pick<UserProfile, "firstName" | "lastName" | "mobile" | "mobileNumber">>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("intro");
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setProfile(null);

      if (currentUser) {
        try {
          const profileSnap = await getDoc(doc(db, "users", currentUser.uid));

          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            setProfile({
              uid: currentUser.uid,
              email: currentUser.email || "",
            });
          }
        } catch {
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || "",
          });
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const openAuthModal = (mode: AuthMode = "intro") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    pendingActionRef.current = null;
    setAuthModalOpen(false);
  };

  const runPendingAction = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;

    if (action) {
      action();
    }
  };

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
      return;
    }

    pendingActionRef.current = action;
    openAuthModal("intro");
  };

  const register = async (data: RegisterData) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const displayName = `${data.firstName} ${data.lastName}`.trim();

    if (displayName) {
      await updateFirebaseProfile(credential.user, { displayName });
    }

    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile || "",
      mobileNumber: data.mobile || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setProfile({
      uid: credential.user.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile || "",
      mobileNumber: data.mobile || "",
    });

    setAuthModalOpen(false);
    runPendingAction();
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);

    setAuthModalOpen(false);
    runPendingAction();
  };

  const updateProfileData = async (
    data: Partial<Pick<UserProfile, "firstName" | "lastName" | "mobile" | "mobileNumber">>,
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to update your profile.");
    }

    const cleanProfile = {
      firstName: data.firstName?.trim() ?? profile?.firstName ?? "",
      lastName: data.lastName?.trim() ?? profile?.lastName ?? "",
      mobile: data.mobile?.trim() ?? data.mobileNumber?.trim() ?? profile?.mobile ?? "",
      mobileNumber: data.mobileNumber?.trim() ?? data.mobile?.trim() ?? profile?.mobileNumber ?? "",
    };
    const displayName = [cleanProfile.firstName, cleanProfile.lastName].filter(Boolean).join(" ").trim();

    if (displayName) {
      await updateFirebaseProfile(currentUser, { displayName });
    }

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        uid: currentUser.uid,
        email: currentUser.email || profile?.email || "",
        ...cleanProfile,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    setProfile((currentProfile) => ({
      ...currentProfile,
      uid: currentUser.uid,
      email: currentUser.email || currentProfile?.email || profile?.email || "",
      ...cleanProfile,
    }));
  };

  const logout = async () => {
    pendingActionRef.current = null;
    setAuthModalOpen(false);
    setProfile(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        login,
        register,
        updateProfileData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
