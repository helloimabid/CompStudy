"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  storage,
  BUCKET_ID,
} from "@/lib/appwrite";
import { ID, Models, Permission, Role, Query } from "appwrite";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: { username?: string; bio?: string }) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<string>;
  needsUsername: boolean;
  setUsernameForOAuth: (username: string) => Promise<void>;
  initiatePasswordRecovery: (email: string) => Promise<void>;
  completePasswordRecovery: (
    userId: string,
    secret: string,
    password: string
  ) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await account.get();
      setUser(session);

      // Check if email is verified
      if (!session.emailVerification) {
        setLoading(false);
        // Redirect to verification notice page if on protected routes
        const publicRoutes = ["/", "/login", "/verify-email", "/reset-password", "/features"];
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        if (!publicRoutes.includes(currentPath)) {
          router.push("/verify-email-notice");
        }
        return;
      }

      // Check if profile exists and create if missing
      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", session.$id)]
        );

        if (profiles.documents.length === 0) {
          // For OAuth users without username, show username dialog
          if (!session.name || session.name.includes("@")) {
            setNeedsUsername(true);
            setLoading(false);
            return;
          }

          // Create profile with the existing name
          await databases.createDocument(
            DB_ID,
            COLLECTIONS.PROFILES,
            ID.unique(),
            {
              userId: session.$id,
              username: session.name,
              totalHours: 0.0,
              streak: 0,
              xp: 0,
            },
            [
              Permission.read(Role.any()),
              Permission.update(Role.user(session.$id)),
              Permission.delete(Role.user(session.$id)),
            ]
          );
        }
      } catch (error) {
        console.error("Error ensuring profile exists:", error);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error: any) {
      // If a session is already active, we can ignore this error and proceed
      if (
        !error.message?.includes(
          "Creation of a session is prohibited when a session is active"
        )
      ) {
        throw error;
      }
    }
    
    const session = await account.get();
    await checkUser();
    
    // Check if email is verified
    if (!session.emailVerification) {
      router.push("/verify-email-notice");
    } else {
      router.push("/dashboard");
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    const userId = ID.unique();

    try {
      // Step 1: Check if username is already taken BEFORE creating account
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error("Username is already taken");
      }

      // Step 2: Create the account
      await account.create(userId, email, password, username);
      console.log("Account created successfully");

      // Step 3: Create session
      await account.createEmailPasswordSession(email, password);
      console.log("Session created successfully");

      // Step 4: Send verification email
      try {
        const verificationUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/verify-email`
            : `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/verify-email`;
        await account.createVerification(verificationUrl);
        console.log("Verification email sent successfully");
      } catch (verificationError) {
        console.error("Failed to send verification email:", verificationError);
        // Don't block registration if verification email fails
      }

      // Step 5: Create user profile in database
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.PROFILES,
        ID.unique(),
        {
          userId: userId,
          username: username,
          totalHours: 0.0,
          streak: 0,
          xp: 0,
        },
        [
          Permission.read(Role.any()), // Anyone can read the profile (for leaderboards)
          Permission.update(Role.user(userId)), // Only the user can update their profile
          Permission.delete(Role.user(userId)), // Only the user can delete their profile
        ]
      );
      console.log("Profile created successfully");

      // Step 6: Redirect to verification notice
      await checkUser();
      router.push("/verify-email-notice");
    } catch (error: any) {
      console.error("Registration error:", error);

      // Clean up: Delete account if profile creation failed
      if (error.message?.includes("profile") || error.message?.includes("database")) {
        try {
          await account.deleteSessions();
        } catch (cleanupError) {
          console.error("Cleanup failed:", cleanupError);
        }
      }

      // Re-throw the error to be caught by the UI
      throw new Error(
        error.message || "Registration failed. Please try again."
      );
    }
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
    router.push("/login");
  };

  const loginWithGoogle = () => {
    try {
      // Get the current origin, ensuring it works in both dev and production
      const successUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/dashboard`;

      const failureUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/login`;

      account.createOAuth2Session("google" as any, successUrl, failureUrl);
    } catch (error) {
      console.error("Google OAuth error:", error);
      throw error;
    }
  };

  const setUsernameForOAuth = async (username: string) => {
    if (!user) throw new Error("No user logged in");

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) {
      throw new Error("Username is already taken");
    }

    // Create profile with the chosen username
    try {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.PROFILES,
        ID.unique(),
        {
          userId: user.$id,
          username: username,
          totalHours: 0.0,
          streak: 0,
          xp: 0,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ]
      );

      // Update account name
      await account.updateName(username);

      setNeedsUsername(false);
      await checkUser();
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Failed to set username:", error);
      throw new Error(error.message || "Failed to set username");
    }
  };

  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("username", username)]
      );
      return profiles.documents.length === 0;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  const updateProfile = async (data: { username?: string; bio?: string }) => {
    if (!user) throw new Error("No user logged in");

    try {
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", user.$id)]
      );

      if (profiles.documents.length > 0) {
        const currentProfile = profiles.documents[0] as any;

        // Only check username availability if it's being changed
        if (data.username && data.username !== currentProfile.username) {
          const isAvailable = await checkUsernameAvailable(data.username);
          if (!isAvailable) {
            throw new Error("Username is already taken");
          }
        }

        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.PROFILES,
          profiles.documents[0].$id,
          data
        );

        // Update account name if username changed
        if (data.username && data.username !== currentProfile.username) {
          await account.updateName(data.username);
        }

        await checkUser();
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) throw new Error("No user logged in");

    try {
      // Upload file to storage
      const fileId = ID.unique();
      const uploadedFile = await storage.createFile(BUCKET_ID, fileId, file);

      // Get file URL
      const fileUrl = storage.getFileView(BUCKET_ID, uploadedFile.$id);

      // Update profile with picture URL
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", user.$id)]
      );

      if (profiles.documents.length > 0) {
        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.PROFILES,
          profiles.documents[0].$id,
          { profilePicture: fileUrl.toString() }
        );
      }

      return fileUrl.toString();
    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      throw new Error(error.message || "Failed to upload profile picture");
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("No user logged in");

    try {
      // Delete profile from database
      const profiles = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PROFILES,
        [Query.equal("userId", user.$id)]
      );

      if (profiles.documents.length > 0) {
        await databases.deleteDocument(
          DB_ID,
          COLLECTIONS.PROFILES,
          profiles.documents[0].$id
        );
      }

      // Delete all sessions (logs out)
      await account.deleteSessions();

      setUser(null);
      router.push("/login");
    } catch (error: any) {
      console.error("Account deletion error:", error);
      throw new Error(error.message || "Failed to delete account");
    }
  };

  const initiatePasswordRecovery = async (email: string) => {
    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/reset-password`;

      await account.createRecovery(email, redirectUrl);
    } catch (error: any) {
      console.error("Password recovery error:", error);
      throw new Error(error.message || "Failed to initiate password recovery");
    }
  };

  const completePasswordRecovery = async (
    userId: string,
    secret: string,
    password: string
  ) => {
    try {
      await account.updateRecovery(userId, secret, password);
    } catch (error: any) {
      console.error("Password reset error:", error);
      throw new Error(error.message || "Failed to reset password");
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const verificationUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/verify-email`
          : `${
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/verify-email`;
      await account.createVerification(verificationUrl);
    } catch (error: any) {
      console.error("Verification email error:", error);
      throw new Error(error.message || "Failed to send verification email");
    }
  };

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      await account.updateVerification(userId, secret);
      await checkUser(); // Refresh user data
    } catch (error: any) {
      console.error("Email verification error:", error);
      throw new Error(error.message || "Failed to verify email");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        deleteAccount,
        updateProfile,
        checkUsernameAvailable,
        uploadProfilePicture,
        needsUsername,
        setUsernameForOAuth,
        initiatePasswordRecovery,
        completePasswordRecovery,
        sendVerificationEmail,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
