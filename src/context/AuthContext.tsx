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
    await account.create(userId, email, password, username);
    await account.createEmailPasswordSession(email, password);

    // Create user profile in database
    try {
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
    } catch (error) {
      console.error("Failed to create user profile:", error);
      // Optional: Handle cleanup if profile creation fails
    }

    await checkUser();
    router.push("/dashboard");
  };

  const logout = async () => {
    await account.deleteSession("current");
    setUser(null);
    router.push("/login");
  };

  const loginWithGoogle = () => {
    account.createOAuth2Session(
      "google" as any,
      `${window.location.origin}/dashboard`,
      `${window.location.origin}/login`
    );
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
