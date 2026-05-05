"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, firebaseInitError } from "@/app/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { AuthTokenManager } from "@/lib/clientAuth";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const passwordValidation = (password: string) => {
    return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const emailElement = form.elements.namedItem("email") as HTMLInputElement | null;
    const passwordElement = form.elements.namedItem("password") as HTMLInputElement | null;
    const passwordConfirmElement = form.elements.namedItem("password-confirm") as HTMLInputElement | null;

    if (!emailElement || !passwordElement || !passwordConfirmElement) {
      setError("Form elements not found");
      return;
    }

    const email = emailElement.value;
    const password = passwordElement.value;
    const passwordConfirm = passwordConfirmElement.value;

    if (password !== passwordConfirm) {
      setError("Both passwords don't match");
      return;
    }
    if (!passwordValidation(password)) {
      setError("Password must be at least 6 characters, include 1 capital letter and 1 number.");
      return;
    }
    setError("");

    try {
      // Check if auth is initialized
      if (firebaseInitError) {
        throw new Error(firebaseInitError);
      }
      if (!auth) {
        throw new Error("Firebase Auth is not initialized.");
      }

      console.log("Starting signup with email:", email);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Firebase signup successful, user UID:", credential.user.uid);
      
      const token = await credential.user.getIdToken();
      console.log("ID token obtained successfully");
      
      if (token) {
        AuthTokenManager.setToken(token);
        
        // Create session on server
        try {
          console.log("Creating server session...");
          const sessionResponse = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: token }),
          });
          
          if (!sessionResponse.ok) {
            console.warn("Session creation returned non-OK status:", sessionResponse.status);
            // Don't throw - session creation failure shouldn't block signup
          } else {
            console.log("Server session created successfully");
          }
        } catch (sessionError) {
          console.warn("Failed to create server session:", sessionError);
          // Continue anyway - user is still authenticated via token
        }
      }
      
      setSuccessMsg("Signup successful! Redirecting...");
      setTimeout(() => {
        setSuccessMsg(null);
        router.push("/complete-profile");
      }, 1800);
    } catch (error) {
      console.error("Error signing up:", error);
      console.error("Error details:", {
        errorType: typeof error,
        errorKeys: error instanceof Error ? Object.keys(error) : [],
        errorString: String(error),
      });
      
      // Type guard for FirebaseError
      if (typeof error === "object" && error !== null && "code" in error) {
        const firebaseError = error as { code?: string; message?: string };
        const errorCode = firebaseError.code;
        
        switch (errorCode) {
          case "auth/email-already-in-use":
            setError("This email is already registered. Please login instead.");
            break;
          case "auth/invalid-email":
            setError("Invalid email address. Please check and try again.");
            break;
          case "auth/weak-password":
            setError("Password is too weak. Please use a stronger password.");
            break;
          case "auth/operation-not-allowed":
            setError("Signup is currently disabled. Please try again later.");
            break;
          case "auth/too-many-requests":
            setError("Too many attempts. Please try again later.");
            break;
          case "auth/network-request-failed":
            setError("Network error. Please check your connection and try again.");
            break;
          default:
            setError(`Signup failed: ${firebaseError.message || "Please try again."}`);
        }
      } else if (error instanceof Error) {
        // Handle Error objects
        setError(error.message || "An unexpected error occurred during signup. Please try again.");
      } else {
        setError("An unexpected error occurred during signup. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {successMsg && (
        <div
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg text-lg font-semibold animate-fade-in"
          role="status"
          aria-live="polite"
        >
          {successMsg}
        </div>
      )}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Back Button - top left, inside the form card */}
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
          <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
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
              <div className="text-red-600 text-sm" role="alert" aria-live="assertive">
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

