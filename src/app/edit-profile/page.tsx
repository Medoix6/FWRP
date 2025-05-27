"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import Script from "next/script"

const storage = getStorage();
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export default function EditProfile() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ displayName: string | null, email: string | null }>({ displayName: null, email: null })
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          displayName: firebaseUser.displayName || "No Username",
          email: firebaseUser.email || "No Email"
        })
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setProfileData({
            fullName: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            postalCode: data.postalCode || "",
            bio: data.bio || "",
            avatar: data.avatar || "",
          })
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    bio: "",
    avatar: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Cloudinary Upload Widget handler
  const handleCloudinaryUpload = () => {
    if (typeof window !== "undefined" && (window as any).cloudinary) {
      const myWidget = (window as any).cloudinary.createUploadWidget(
        {
          cloudName: 'drig5ndvt',
          uploadPreset: 'avatar_upload',
          cropping: true,
          multiple: false,
          folder: 'avatars',
        },
        async (error: any, result: any) => {
          if (!error && result && result.event === "success") {
            const url = result.info.secure_url;
            setProfileData((prev) => ({ ...prev, avatar: url }));
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) throw new Error("No authenticated user");
              const userRef = doc(db, "users", currentUser.uid);
              // Save only the avatar URL using UID
              await updateDoc(userRef, { avatar: url });
              setErrorMsg(null);
            } catch (err: any) {
              setErrorMsg("Failed to update avatar in database.");
            }
          }
        }
      );
      myWidget.open();
    }
  };

  const handleResetAvatar = async () => {
    setProfileData((prev) => ({ ...prev, avatar: "" }));
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { avatar: "" });
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg("Failed to reset avatar in database.");
    }
  };

  const handleEditOrSubmit = async (e: React.FormEvent) => {
    if (!isEditMode) {
      e.preventDefault();
      setIsEditMode(true);
      return;
    }
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      let avatarUrl = profileData.avatar;
      const userRef = doc(db, "users", currentUser.uid);
      console.log("Updating Firestore profile...");
      await updateDoc(userRef, {
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        postalCode: profileData.postalCode,
        bio: profileData.bio,
        avatar: avatarUrl,
      });
      setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
      setIsEditMode(false);
      console.log("Profile updated successfully.");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setErrorMsg(error?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex flex-col items-center mb-8">
              <Avatar className="w-24 h-24 mb-2">
                <AvatarImage src={profileData.avatar || "/placeholder.svg?height=80&width=80"} alt="Profile" />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <span className="text-lg font-semibold">
                {profileData.fullName || user.displayName}
              </span>
            </div>

            <nav className="mt-8 space-y-2">
              <Link href="/edit-profile" className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md">
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
            <h1 className="text-3xl font-bold text-gray-900">Show Profile</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>

            <form onSubmit={handleEditOrSubmit} className="space-y-6">
              <div>
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="mt-1 flex items-center space-x-5">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profileData.avatar || "/placeholder.svg?height=80&width=80"} alt="Profile" />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  {isEditMode && (
                    <>
                      <Button type="button" onClick={handleCloudinaryUpload} className="ml-4 bg-blue-600 text-white">Upload Avatar</Button>
                      <Button type="button" onClick={handleResetAvatar} className="ml-2 bg-gray-200 text-gray-800">Reset Avatar</Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" value={profileData.fullName} onChange={handleChange} required readOnly={!isEditMode} />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    required
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" value={profileData.phone} onChange={handleChange} required readOnly={!isEditMode} />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={profileData.address} onChange={handleChange} required readOnly={!isEditMode} />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={profileData.city} onChange={handleChange} required readOnly={!isEditMode} />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" name="state" value={profileData.state} onChange={handleChange} required readOnly={!isEditMode} />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={profileData.postalCode}
                    onChange={handleChange}
                    required
                    readOnly={!isEditMode}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  placeholder="Tell us a bit about yourself"
                  rows={4}
                  readOnly={!isEditMode}
                />
              </div>

              {errorMsg && (
                <div className="mb-4 text-red-600 font-semibold">{errorMsg}</div>
              )}

              <div className="pt-4 flex justify-end space-x-4">
                {isEditMode && (
                  <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Edit"}
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

      {/* Cloudinary Upload Widget Script */}
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="beforeInteractive" />
    </div>
  )
}
