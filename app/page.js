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
      <h1>Hello World</h1>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <p>User ID: {user.uid}</p>
        </div>
      ) : (
        <p>No user signed in</p>
      )}
    </div>
  );
}
