"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/libs/auth";
import Image from "next/image";

export default function Navbar() {
  const { user, isAuthenticated, loading } = useAuth();

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
      <div className="flex items-center gap-4">
        <Link href="/">Home</Link>
        {isAuthenticated && <Link href="/add-post">Add Post</Link>}
      </div>
      <div className="flex items-center gap-4">
        {!loading && isAuthenticated ? (
          <>
            <span className="hidden md:block">
              Welcome, {user.displayName || user.email}
            </span>
            <Link
              href="/profile"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Image
                src={user.photoURL || "./avatar.jpg"}
                alt="user"
                className="w-10 h-10 rounded-full"
                width={40}
                height={40}
              />
              <span className="hidden sm:block">Profile</span>
            </Link>
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
