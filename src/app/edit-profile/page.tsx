"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, ArrowLeft, Settings, Shield } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { auth } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserProfileData, updateUserProfile } from "@/controllers/profileController"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { deleteUser } from "firebase/auth"

export default function EditProfile() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ displayName: string | null, email: string | null }>({ displayName: null, email: null })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [cloudinaryWidgetOpen, setCloudinaryWidgetOpen] = useState(false)
  const [cloudinaryReady] = useState(true)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null)

  // Assume Cloudinary widget is ready (forcibly enable button)
  // If you want to keep the robust check, comment out the next line and restore the useEffect above
  // useEffect(() => { ... });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          displayName: firebaseUser.displayName || "No Username",
          email: firebaseUser.email || "No Email"
        });
        const data = await getUserProfileData(firebaseUser.uid);
        if (data) {
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
          });
          setIsAdmin(!!data.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

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
    type CloudinaryWidget = {
      open: () => void;
    };
    type CloudinaryWindow = typeof window & {
      cloudinary?: {
        createUploadWidget: (
          options: Record<string, unknown>,
          callback: (error: unknown, result: unknown) => void
        ) => CloudinaryWidget;
      };
    };
    if (typeof window !== "undefined" && (window as CloudinaryWindow).cloudinary) {
      setIsAvatarUploading(true);
      setAvatarSuccess(null);
      setErrorMsg(null);
      const myWidget = (window as CloudinaryWindow).cloudinary!.createUploadWidget(
        {
          cloudName: 'drig5ndvt',
          uploadPreset: 'avatar_upload',
          cropping: true,
          multiple: false,
          folder: 'avatars',
        },
        async (error: unknown, result: unknown) => {
          if (!error && result && typeof result === 'object' && result !== null && (result as { event?: string }).event === "success") {
            const info = (result as { info?: { secure_url?: string } }).info;
            const url = (info?.secure_url ?? "") + '?t=' + Date.now();
            setProfileData((prev) => ({ ...prev, avatar: url }));
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) throw new Error("No authenticated user");
              await updateUserProfile(currentUser.uid, { avatar: url });
              setErrorMsg(null);
              setAvatarSuccess("Avatar updated successfully!");
            } catch {
              setErrorMsg("Failed to update avatar in database.");
            }
          } else if (error) {
            setErrorMsg("Cloudinary upload failed. Please try again.");
          }
          setCloudinaryWidgetOpen(false);
          setIsAvatarUploading(false);
        }
      );
      myWidget.open();
      setCloudinaryWidgetOpen(true);
    } else {
      setErrorMsg("Cloudinary widget failed to load. Please try again later.");
    }
  };

  const handleResetAvatar = async () => {
    setProfileData((prev) => ({ ...prev, avatar: "" }));
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      await updateUserProfile(currentUser.uid, { avatar: "" });
      setErrorMsg(null);
    } catch {
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
      const avatarUrl = profileData.avatar;
      await updateUserProfile(currentUser.uid, {
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
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMsg((error as Error)?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false)

  const passwordValidation = (password: string) => {
    return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordSubmitting(true);
    if (!passwordValidation(newPassword)) {
      setPasswordError("Password must be at least 6 characters, include 1 capital letter and 1 number.");
      setIsPasswordSubmitting(false);
      return;
    }
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("No authenticated user");
      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("Password updated successfully.");
      setShowPasswordFields(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      if (
        typeof error === 'object' && error !== null &&
        ('code' in error || 'message' in error)
      ) {
        const code = (error as { code?: string }).code;
        const message = (error as { message?: string }).message;
        if (code === "auth/invalid-credential" || (typeof message === 'string' && message.includes("auth/invalid-credential"))) {
          setPasswordError("The current password you entered is incorrect.");
        } else {
          setPasswordError(message || "Failed to update password.");
        }
      } else {
        setPasswordError("Failed to update password.");
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

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
              {isAdmin === null ? null : (
                <>
                  <Link href="/edit-profile" className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md">
                    <Settings className="h-5 w-5 mr-3" />
                    Show Profile
                  </Link>
                  {isAdmin ? (
                    <Link href="/admin" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                      <Shield className="h-5 w-5 mr-3" />
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                        <Home className="h-5 w-5 mr-3" />
                        Dashboard
                      </Link>
                      <Link href="/donate-food" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                        <Gift className="h-5 w-5 mr-3" />
                        Donate Food
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                try {
                  await auth.signOut();
                  router.push("/login");
                } catch {
                  setErrorMsg("Failed to sign out. Please try again.");
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
                      <Button
                        type="button"
                        onClick={handleCloudinaryUpload}
                        className="ml-4 bg-blue-600 text-white"
                        disabled={!cloudinaryReady || isAvatarUploading}
                        title={cloudinaryReady ? "Upload Avatar" : "Cloudinary widget is not ready yet"}
                      >
                        {isAvatarUploading ? (
                          <span className="flex items-center"><span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>Uploading...</span>
                        ) : "Upload Avatar"}
                      </Button>
                      <Button type="button" onClick={handleResetAvatar} className="ml-2 bg-gray-200 text-gray-800" disabled={isAvatarUploading}>Reset Avatar</Button>
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
              {avatarSuccess && (
                <div className="mb-4 text-green-600 font-semibold">{avatarSuccess}</div>
              )}

              <div className="pt-4 flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPasswordFields((v) => !v)}>
                  {showPasswordFields ? "Cancel Password Change" : "Change Password"}
                </Button>
                {showPasswordFields && (
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    {passwordError && <div className="text-red-600">{passwordError}</div>}
                    {passwordSuccess && <div className="text-green-600">{passwordSuccess}</div>}
                    <Button onClick={handlePasswordChange} disabled={isPasswordSubmitting} type="button">
                      {isPasswordSubmitting ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                )}
              </div>

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
                <Button
                  type="button"
                  variant="destructive"
                  className="ml-2 bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
                    setIsSubmitting(true);
                    setErrorMsg(null);
                    try {
                      const currentUser = auth.currentUser;
                      if (!currentUser) throw new Error("No authenticated user");
                      await deleteUser(currentUser);
                      router.push("/signup");
                    } catch (error) {
                      setErrorMsg((error as Error)?.message || "Failed to delete account. Please try again.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Delete Account
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>


      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {cloudinaryWidgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col items-center">
            <span className="mb-4 text-lg font-semibold">Uploading Avatar...</span>
            <Button onClick={() => setCloudinaryWidgetOpen(false)} variant="outline">Cancel</Button>
          </div>
        </div>
      )}


    </div>
  )
}
