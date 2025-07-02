"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/app/firebase";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordValidation = (password: string) => {
    return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const { email, password, "password-confirm": passwordConfirm } = form.elements as any;

    if (password.value !== passwordConfirm.value) {
      setError("Both passwords don't match");
      return;
    }
    if (!passwordValidation(password.value)) {
      setError("Password must be at least 6 characters, include 1 capital letter and 1 number.");
      return;
    }
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value); 
      const user = userCredential.user;
      setSuccessMsg("Signup successful! Redirecting...");
      setTimeout(() => {
        setSuccessMsg(null);
        router.push("/complete-profile");
      }, 1800);
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {successMsg && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg text-lg font-semibold animate-fade-in">
          {successMsg}
        </div>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1">
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input id="password" name="password" type="password" autoComplete="new-password" required />
              </div>
            </div>

            <div>
              <Label htmlFor="password-confirm">Confirm Password</Label>
              <div className="mt-1">
                <Input
                  id="password-confirm"
                  name="password-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}
            <div>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                Login
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

