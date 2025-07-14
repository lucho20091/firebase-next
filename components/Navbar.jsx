"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/libs/auth";

export default function Navbar() {
  const { user, isAuthenticated, loading } = useAuth();

  console.log("user", user);
  console.log("isAuthenticated", isAuthenticated);
  console.log("loading", loading);
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <nav className="flex justify-between items-center p-4">
        <Link href="/">Home</Link>
        <div>Loading...</div>
      </nav>
    );
  }

  return (
    <nav className="flex justify-between items-center p-4">
      <Link href="/">Home</Link>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <span>Welcome, {user.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/signin">Sign In</Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
