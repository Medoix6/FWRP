
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged, getAuth } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
// import CloudinaryAvatar from "@/components/ui/CloudinaryAvatar" // Unused import


interface FormDataType {
  title: string;
  description: string;
  location: string;
  expiryDate: string;
  pickupInstructions: string;
}

interface ProfileDataType {
  fullName: string;
  email: string;
  avatar: string;
}

export default function DonateFood() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    location: "",
    expiryDate: "",
    pickupInstructions: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileDataType>({
    fullName: "",
    email: "",
    avatar: ""
  });

  // Auth guard useEffect (moved inside component)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const authUser = getAuth().currentUser;
      if (!authUser) {
        alert("You must be logged in to donate food.");
        setIsSubmitting(false);
        return;
      }
      const form = new FormData();
      form.append("foodName", formData.title);
      form.append("description", formData.description);
      form.append("location", formData.location);
      form.append("expiryDate", formData.expiryDate);
      form.append("pickupInstructions", formData.pickupInstructions);
      form.append("userId", authUser.uid);
      const fileInput = document.getElementById("foodImage") as HTMLInputElement | null;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        form.append("image", fileInput.files[0]);
      }
      const res = await fetch("/api/donated-food", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to donate food");
      }
      setSuccessMsg("Food donation submitted successfully!");
      setTimeout(() => {
        setSuccessMsg(null);
        router.push("/dashboard");
      }, 1800);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message || "Error submitting form");
      } else {
        alert("Error submitting form");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const fullName = userDoc.exists() ? userDoc.data().name : "";
        const avatar = userDoc.exists() ? userDoc.data().avatar || "" : "";
        const email = currentUser.email || "";
        setProfileData({
          fullName: fullName || currentUser.displayName || "",
          email: email,
          avatar: avatar
        });
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {successMsg && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg text-lg font-semibold animate-fade-in">
          {successMsg}
        </div>
      )}
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-green-600">FWRP</h2>
          </div>

          <div className="flex-1 py-6 px-4 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profileData.avatar || "/placeholder.svg?height=80&width=80"} alt="Profile" />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-medium">{profileData.fullName}</h3>
                <p className="text-sm text-gray-500">{profileData.email}</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              <Link href="/edit-profile" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                <Settings className="h-5 w-5 mr-3" />
                Edit Profile
              </Link>
              <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link href="/donate-food" className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md">
                <Gift className="h-5 w-5 mr-3" />
                Donate Food
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                try {
                  await auth.signOut();
                  window.location.href = "/login";
                } catch {
                  alert("Failed to sign out. Please try again.");
                }
              }}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Donate Food</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Share Your Excess Food</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Food Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="E.g., Fresh Vegetables, Homemade Bread"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the food, quantity, and condition"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Pickup Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Address or general area for pickup"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="pickupInstructions">Pickup Instructions</Label>
                <Textarea
                  id="pickupInstructions"
                  name="pickupInstructions"
                  value={formData.pickupInstructions}
                  onChange={handleChange}
                  placeholder="Any special instructions for pickup"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="foodImage">Food Image</Label>
                <div className="mt-1 flex items-center">
                  <label className="block w-full">
                    <span className="sr-only">Choose food image</span>
                    <Input
                      id="foodImage"
                      name="foodImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-50 file:text-green-700
                        hover:file:bg-green-100"
                      required
                    />
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
                    <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Food preview"
                        className="w-full h-full object-cover"
                      />
                      {/* X button to remove image */}
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 shadow-md border border-gray-300"
                        onClick={() => {
                          setImagePreview(null);
                          const fileInput = document.getElementById("foodImage") as HTMLInputElement | null;
                          if (fileInput) fileInput.value = "";
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Donate Food"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
