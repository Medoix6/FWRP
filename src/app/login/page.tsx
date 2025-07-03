"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { auth } from "@/app/firebase"
import { db } from "@/app/firebase"
import { loginUser, sendReset } from "@/controllers/authController"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    if (!resetEmail) {
      setResetMsg("Please enter your email address.");
      return;
    }
    try {
      await sendReset(auth, resetEmail);
      setResetMsg("If the email is registered, you will receive an email to reset your password.");
    } catch (err: any) {
      setResetMsg(err.message || "Failed to send reset email.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    try {
      const userData = await loginUser(auth, db, email, password);
      if (userData && userData.isAdmin) {
        router.push("/admin");
      } else if (userData) {
        router.push("/dashboard");
      } else {
        setError("User not found");
      }
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Login to your account</h2>
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
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>

          {/* Forgot Password Section - now outside the login form */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-md font-semibold mb-2">Forgot your password?</h3>
            <form className="flex flex-col gap-3" onSubmit={handlePasswordReset}>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="outline" className="w-full">Send Password Reset Email</Button>
            </form>
            {resetMsg && (
              <div className={`mt-2 text-sm ${resetMsg.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>{resetMsg}</div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-medium text-green-600 hover:text-green-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
  }
