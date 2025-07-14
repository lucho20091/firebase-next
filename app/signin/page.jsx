"use client";
import { signIn, signInWithGoogle } from "@/libs/auth";
import { useState } from "react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (user) {
      redirect("/");
    }
  }, [user]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      toast.error("Invalid email or password");
    }
  };

  const handleSignInWithGoogle = async (e) => {
    console.log("this is running");
    e.preventDefault();
    console.log("handleSignInWithGoogle");
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error("Error signing in with Google");
    }
  };

  return (
    <section>
      <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
        <form className="flex flex-col gap-4 w-full">
          <input
            type="email"
            placeholder="Email"
            className="border-2 border-black  p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border-2 border-black  p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleSignIn}
            className="py-2 px-4 bg-black text-white border-black border-2 shadow-xl cursor-pointer"
          >
            Sign in
          </button>
        </form>
        <button
          onClick={handleSignInWithGoogle}
          className="py-2 px-4 bg-white border-black border-2 shadow-xl w-full flex items-center gap-2 justify-center cursor-pointer"
        >
          <img
            src="https://docs.material-tailwind.com/icons/google.svg"
            alt="metamask"
            className="h-6 w-6"
          />
          Sign in with Google
        </button>
      </div>
    </section>
  );
}
