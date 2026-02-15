
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, ArrowLeft, Settings, MessageCircle } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/app/firebase"
import { AuthTokenManager } from "@/lib/clientAuth"
import { getCsrfHeaders } from "@/lib/clientCsrf"
import { onAuthStateChanged, getAuth } from "firebase/auth"
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore"
import { LoadingSpinner } from "@/components/Loading"
import { logout } from "@/lib/logout"
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
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileDataType>({
    fullName: "",
    email: "",
    avatar: ""
  });
  const [unreadCount, setUnreadCount] = useState(0);

  // Auth guard useEffect (moved inside component)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for unread messages
  useEffect(() => {
    if (!profileData.email) return;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");
    const unreadQuery = query(
      messagesRef,
      where("receiverId", "==", currentUser.uid),
      where("status", "in", ["sent", "delivered"])
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [profileData.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 4 - imagePreviews.length); // Limit to max 4 total
      
      newImages.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => {
            if (prev.length < 4) {
              return [
                ...prev,
                {
                  id: Math.random().toString(36).substr(2, 9),
                  preview: reader.result as string,
                  file: file,
                },
              ];
            }
            return prev;
          });
        };
        reader.readAsDataURL(file);
      });
      
      // Reset input value
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => prev.filter((img) => img.id !== id));
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

      if (imagePreviews.length === 0) {
        alert("Please upload at least one image.");
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
      
      // Append all images
      imagePreviews.forEach((img) => {
        form.append("images", img.file);
      });

      const authHeader = AuthTokenManager.getAuthHeader();
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/donated-food", {
        method: "POST",
        headers: {
          ...(authHeader || {}),
          ...csrfHeaders,
        },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json();
        const message = data?.error?.message || data?.error || "Failed to donate food";
        throw new Error(message);
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-white flex">
      {successMsg && (
        <div
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg text-lg font-semibold animate-fade-in"
          role="status"
          aria-live="polite"
        >
          {successMsg}
        </div>
      )}
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white border-emerald-200 hover:bg-emerald-50">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-sm shadow-xl border-r border-emerald-100 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50">
            <h2 className="text-2xl font-bold text-emerald-600">FWRP</h2>
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
              <Link href="/edit-profile" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <Settings className="h-5 w-5 mr-3" />
                Show Profile
              </Link>
              <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link href="/donate-food" className="flex items-center p-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
                <Gift className="h-5 w-5 mr-3" />
                Donate Food
              </Link>
              <Link href="/chat" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <MessageCircle className="h-5 w-5 mr-3" />
                <span className="flex-1">Chat</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-emerald-100">
            <Button
              variant="outline"
              className="w-full justify-start border-emerald-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              onClick={async () => {
                try {
                  await logout();
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
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Donate Food</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 shadow-lg rounded-3xl border border-emerald-100 p-8">
            <h2 className="text-2xl font-semibold mb-2 text-gray-900">Share Your Excess Food</h2>
            <p className="text-sm text-gray-600 mb-6">Help reduce food waste by donating to those in need</p>

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
                  min={new Date().toISOString().split('T')[0]}
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
                <Label htmlFor="foodImages">Food Images (Max 4)</Label>
                <div className="mt-1 flex items-center">
                  <label className="block w-full">
                    <span className="sr-only">Choose food images</span>
                    <Input
                      id="foodImages"
                      name="foodImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={imagePreviews.length >= 4}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-emerald-50 file:text-emerald-700
                        hover:file:bg-emerald-100
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {imagePreviews.length}/4 images uploaded
                </p>

                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-3">Image Preview:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {imagePreviews.map((img) => (
                        <div key={img.id} className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.preview}
                            alt="Food preview"
                            className="w-full h-full object-cover"
                          />
                          {/* X button to remove image */}
                          <button
                            type="button"
                            aria-label="Remove image"
                            className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-1 shadow-md border border-gray-300"
                            onClick={() => removeImage(img.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
                  {isSubmitting ? <><LoadingSpinner size="sm" /> <span className="ml-2">Submitting...</span></> : "Donate Food"}
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
