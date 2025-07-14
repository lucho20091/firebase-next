"use client";
export const dynamic = "force-dynamic";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isAuthenticated ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <p>Welcome, {user.displayName || user.email}!</p>
          <img
            src={user.photoURL || "./avatar.jpg"}
            alt="user"
            className="w-10 h-10 rounded-full"
          />
          <p>This is your Todo List</p>
        </div>
      ) : (
        <p>No user signed in</p>
      )}
    </div>
  );
}
