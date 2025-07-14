"use client";
import { createAccount, signInWithGoogle } from "@/libs/auth";
import { useState } from "react";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    await createAccount(email, password);
  };

  const handleSignInWithGoogle = async (e) => {
    console.log("this is running");
    e.preventDefault();
    await signInWithGoogle();
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
            onClick={handleCreateAccount}
            className="py-2 px-4 bg-black text-white border-black border-2 shadow-xl text-center cursor-pointer"
          >
            Create Account
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
