"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { auth } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { fetchDonationById } from "@/controllers/donationController"
import { getUserProfile } from "@/controllers/dashboardController"
import { AuthTokenManager } from "@/lib/clientAuth"
import { getCsrfHeaders } from "@/lib/clientCsrf"
import { LoadingScreen, LoadingSpinner } from "@/components/Loading"
import { logout } from "@/lib/logout"

interface ImagePreview {
  id: string;
  preview: string;
  file: File | null;
}

export default function EditDonation() {
  const router = useRouter()
  const params = useParams()
  const donationId = (params?.id ?? "") as string
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    expiryDate: "",
    pickupInstructions: "",
  })
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // Removed unused user state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    avatar: ""
  })
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Load existing donation data from API
  useEffect(() => {
    if (!mounted) return;
    const loadDonation = async () => {
      try {
        const donation = await fetchDonationById(donationId);
        setFormData({
          title: donation.foodName || "",
          description: donation.description || "",
          location: donation.location || "",
          expiryDate: donation.expiryDate || "",
          pickupInstructions: donation.pickupInstructions || "",
        });
        // Handle both old imageUrl (string) and new imageUrls (array) formats
        const existingImages = (donation.imageUrls || (donation.imageUrl ? [donation.imageUrl] : [])) as string[];
        const loadedImages: ImagePreview[] = existingImages.slice(0, 4).map((url, index) => ({
          id: `existing-${index}`,
          preview: url,
          file: null, // No actual file for existing images
        }));
        setImagePreviews(loadedImages);
      } catch (error) {
        console.error("Error loading donation:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    if (donationId) loadDonation();
  }, [donationId, router, mounted]);

  // Fetch user profile (same as dashboard)
  useEffect(() => {
    if (!mounted) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser);
        setProfileData({
          fullName: profile.fullName || profile.displayName,
          email: profile.email,
          avatar: profile.avatar
        });
      } else {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, [mounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      form.append("location", formData.location);
      form.append("expiryDate", formData.expiryDate);
      form.append("pickupInstructions", formData.pickupInstructions);
      
      // Collect existing images to keep (those without a file property)
      const existingImagesToKeep = imagePreviews
        .filter((img) => !img.file)
        .map((img) => img.preview);
      
      // Send existing images that should be kept
      if (existingImagesToKeep.length > 0) {
        form.append("existingImages", JSON.stringify(existingImagesToKeep));
      }
      
      // Only append new files
      imagePreviews.forEach((img) => {
        if (img.file) {
          form.append("images", img.file);
        }
      });

      const res = await fetch(`/api/donated-food/${donationId}`, {
        method: "PATCH",
        headers: {
          ...(AuthTokenManager.getAuthHeader() || {}),
          ...(await getCsrfHeaders()),
        },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || data.error || "Failed to update donation");
      }
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      console.error("Error updating donation:", error);
      alert("Error updating donation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  } 

  // Removed unused handleDelete

  if (isLoading) {
    return <LoadingScreen message="Loading donation..." />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
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
                Show Profile
              </Link>
              <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link href="/donate-food" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
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
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Food Donation</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Update Your Food Donation</h2>
            </div>

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
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-green-50 file:text-green-700
                        hover:file:bg-green-100
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {imagePreviews.length}/4 images
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

              <div className="pt-4 flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}> 
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><LoadingSpinner size="sm" /> <span className="ml-2">Updating...</span></> : "Update Donation"}
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
