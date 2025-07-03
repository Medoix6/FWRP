"use client"

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
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { fetchDonationById } from "@/controllers/donationController"
import { getUserProfile } from "@/controllers/dashboardController"

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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ displayName: string | null, email: string | null, fullName?: string | null, avatar?: string | null }>({ displayName: null, email: null, avatar: null })
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    avatar: ""
  })
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Load existing donation data from API
  useEffect(() => {
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
        setImagePreview(donation.imageUrl || "/placeholder.svg");
      } catch (error) {
        console.error("Error loading donation:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    if (donationId) loadDonation();
  }, [donationId, router]);

  // Fetch user profile (same as dashboard)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser);
        setUser(profile);
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let body: FormData | string;
      let headers: Record<string, string> = {};
      if (imageFile) {
        body = new FormData();
        body.append("title", formData.title);
        body.append("description", formData.description);
        body.append("location", formData.location);
        body.append("expiryDate", formData.expiryDate);
        body.append("pickupInstructions", formData.pickupInstructions);
        body.append("foodImage", imageFile);
      } else {
        body = JSON.stringify({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          expiryDate: formData.expiryDate,
          pickupInstructions: formData.pickupInstructions,
        });
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(`/api/donated-food/${donationId}`, {
        method: "PATCH",
        body,
        headers,
      });
      if (!res.ok) throw new Error("Failed to update donation");
      // Optionally, fetch the updated donation to get the new image URL
      // const updated = await res.json();
      // setImagePreview(updated.imageUrl || "/placeholder.svg");
      setImageFile(null);
      // router.push("/dashboard");
      // Instead of redirecting immediately, reload the donation to update preview
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      console.error("Error updating donation:", error);
    } finally {
      setIsSubmitting(false);
    }
  } 

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this donation? This action cannot be undone.")) {
      try {
        const res = await fetch(`/api/donated-food/${donationId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete donation")
        router.push("/dashboard")
      } catch (error) {
        console.error("Error deleting donation:", error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading donation...</p>
        </div>
      </div>
    )
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
                Edit Profile
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
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/login">
                <LogOut className="h-5 w-5 mr-3" />
                Sign out
              </Link>
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
                    />
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                    <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Food preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}> 
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Donation"}
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
