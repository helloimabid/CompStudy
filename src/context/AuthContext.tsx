"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { account, databases, DB_ID, COLLECTIONS } from "@/lib/appwrite";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await account.get();
      setUser(session);

      // Check if profile exists and create if missing
      try {
        const profiles = await databases.listDocuments(
          DB_ID,
          COLLECTIONS.PROFILES,
          [Query.equal("userId", session.$id)]
        );

        if (profiles.documents.length === 0) {
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
    await checkUser();
    router.push("/dashboard");
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ) => {
    const userId = ID.unique();

    try {
      // Step 1: Create the account
      await account.create(userId, email, password, username);
      console.log("Account created successfully");

      // Step 2: Create session
      await account.createEmailPasswordSession(email, password);
      console.log("Session created successfully");

      // Step 3: Create user profile in database
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

      // Step 4: Refresh user data
      await checkUser();
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);

      // If account was created but profile/session failed, try to login instead
      if (error.code === 409 || error.message?.includes("already exists")) {
        try {
          await account.createEmailPasswordSession(email, password);
          await checkUser();
          router.push("/dashboard");
          return;
        } catch (loginError) {
          console.error("Auto-login failed:", loginError);
        }
      }

      // Re-throw the error to be caught by the UI
      throw new Error(
        error.message || "Registration failed. Please try logging in instead."
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, loginWithGoogle }}
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
