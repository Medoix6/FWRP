"use client";

export const dynamic = "force-dynamic";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Gift,
  User,
  LogOut,
  Menu,
  ArrowLeft,
  Settings,
  Shield,
  MessageCircle,
  KeyRound,
  ShieldAlert,
  Loader2,
  Trash2,
  CheckCircle2,
  Star
} from "lucide-react";
import { auth, db } from "@/app/firebase";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { usersService } from "@/services/usersService";
import { logout } from "@/lib/logout";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import { LoadingSpinner } from "@/components/Loading";

type TabType = "info" | "security";

export default function EditProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const isAdminView = mounted && searchParams?.get("admin") === "1";
  
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [ratingInfo, setRatingInfo] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
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
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  
  // Account delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user profile on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsProfileLoading(true);
        try {
          const data = await usersService.fetchUserProfile(firebaseUser.uid);
          if (data) {
            setProfileData({
              fullName: data.name || data.fullName || firebaseUser.displayName || "",
              email: data.email || firebaseUser.email || "",
              phone: data.phone || "",
              address: data.address || "",
              city: data.city || "",
              state: data.state || "",
              postalCode: data.postalCode || "",
              bio: data.bio || "",
              avatar: data.avatar || "",
            });
            setIsAdmin(Boolean(data.isAdmin));
            setIsVerified(Boolean(data.isVerified));
            setRatingInfo({
              average: Number(data.ratingAverage || 0),
              count: Number(data.ratingCount || 0),
            });
          }
        } catch (err: any) {
          toast.error("Could not fetch user profile details.");
          setIsAdmin(false);
        } finally {
          setIsProfileLoading(false);
        }
      } else {
        setIsAdmin(false);
        setIsProfileLoading(false);
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Cloudinary Avatar Upload Widget
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
      const myWidget = (window as CloudinaryWindow).cloudinary!.createUploadWidget(
        {
          cloudName: "drig5ndvt",
          uploadPreset: "avatar_upload",
          cropping: true,
          multiple: false,
          folder: "avatars",
        },
        async (error: unknown, result: any) => {
          if (!error && result && result.event === "success") {
            const url = (result.info?.secure_url ?? "") + "?t=" + Date.now();
            setProfileData((prev) => ({ ...prev, avatar: url }));
            try {
              const currentUser = auth?.currentUser;
              if (!currentUser) throw new Error("No authenticated user");
              await usersService.updateUserProfile(currentUser.uid, { avatar: url });
              toast.success("Avatar image updated!");
            } catch {
              toast.error("Failed to update avatar in database.");
            }
          } else if (error) {
            toast.error("Upload widget error.");
          }
          setIsAvatarUploading(false);
        }
      );
      myWidget.open();
    } else {
      toast.error("Cloudinary widget failed to load. Please try again later.");
    }
  };

  const handleResetAvatar = async () => {
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      await usersService.updateUserProfile(currentUser.uid, { avatar: "" });
      setProfileData((prev) => ({ ...prev, avatar: "" }));
      toast.success("Avatar image reset.");
    } catch {
      toast.error("Failed to reset avatar in database.");
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error("No authenticated user");

      await usersService.updateUserProfile(currentUser.uid, {
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        postalCode: profileData.postalCode,
        bio: profileData.bio,
      });

      toast.success("Profile saved successfully!");
      setIsEditMode(false);
      
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordSubmitting(true);

    const passwordValidation = (pwd: string) => {
      return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pwd);
    };

    if (!passwordValidation(newPassword)) {
      toast.error("Password must be at least 6 chars with 1 capital and 1 number.");
      setIsPasswordSubmitting(false);
      return;
    }

    try {
      const currentUser = auth?.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("No authenticated user");
      
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        toast.error("The current password you entered is incorrect.");
      } else {
        toast.error(error.message || "Failed to update password.");
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion.");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error("No authenticated user");
      
      await deleteUser(currentUser);
      toast.success("Account deleted. Farewell!");
      router.push("/signup");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account. Re-login and try again.");
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  const activePath: string = "/edit-profile";

  if (isProfileLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/50 flex">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-white border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </Button>
        </div>

        {/* Sidebar Nav */}
        <Sidebar activePath="/edit-profile" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} adminContext={isAdminView} />

        {/* Main Area */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <header className="bg-white border-b border-slate-100 py-6 px-6 sm:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">Profile Settings</h1>
              <p className="text-sm text-gray-500 mt-1 font-body">Manage your profile info, security settings, and credentials</p>
            </div>
            <Link href={isAdminView ? "/admin" : "/dashboard"}>
              <Button variant="ghost" className="text-gray-600 hover:text-emerald-700 flex items-center gap-2 hover:bg-emerald-50/50 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
                Back to {isAdminView ? "Admin Dashboard" : "Dashboard"}
              </Button>
            </Link>
          </header>

          <main className="flex-1 max-w-4xl mx-auto w-full py-8 px-6 sm:px-8 space-y-6">
            {/* Account Badges Row */}
            <div className="flex flex-wrap items-center gap-3">
              {isVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Verified Account
                </span>
              )}
              {ratingInfo.count > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mr-1" />
                  Rating {ratingInfo.average.toFixed(1)} ({ratingInfo.count} reviews)
                </span>
              )}
            </div>

            {/* Premium Tabbed Navigation */}
            <div className="flex border-b border-slate-200">
              <button
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "info"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("info")}
              >
                Profile Information
              </button>
              <button
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                  activeTab === "security"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setActiveTab("security")}
              >
                Security & Danger Zone
              </button>
            </div>

            {/* Tab: Profile Info */}
            {activeTab === "info" && (
              <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar Upload Container */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Profile Picture</Label>
                    <div className="flex items-center gap-5">
                      <Avatar className="h-20 w-20 border border-slate-100 shadow-sm">
                        <AvatarImage src={profileData.avatar} alt="Profile" />
                        <AvatarFallback className="bg-emerald-50 text-emerald-800 text-lg font-bold">
                          {profileData.fullName ? profileData.fullName[0].toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>

                      {isEditMode && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleCloudinaryUpload}
                            disabled={isAvatarUploading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                          >
                            {isAvatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Image"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleResetAvatar}
                            className="text-gray-600 hover:bg-slate-50 border border-slate-200 rounded-xl"
                          >
                            Reset
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-gray-500 uppercase">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleChange}
                        required
                        readOnly={!isEditMode}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        readOnly
                        className="rounded-xl border-slate-200 bg-slate-50 text-gray-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs font-semibold text-gray-500 uppercase">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleChange}
                        required
                        readOnly={!isEditMode}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="address" className="text-xs font-semibold text-gray-500 uppercase">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleChange}
                        required
                        readOnly={!isEditMode}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs font-semibold text-gray-500 uppercase">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleChange}
                        required
                        readOnly={!isEditMode}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="state" className="text-xs font-semibold text-gray-500 uppercase">State/Province</Label>
                      <Input
                        id="state"
                        name="state"
                        value={profileData.state}
                        onChange={handleChange}
                        required
                        readOnly={!isEditMode}
                        className="rounded-xl border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="postalCode" className="text-xs font-semibold text-gray-500 uppercase">Postal Code</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={profileData.postalCode}
                        onChange={handleChange}
                        required
                        readOnly={!isEditMode}
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bio" className="text-xs font-semibold text-gray-500 uppercase">Short Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleChange}
                      placeholder="Share details about your volunteer work, organization, or dietary needs..."
                      rows={4}
                      readOnly={!isEditMode}
                      className="rounded-xl border-slate-200"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex gap-3">
                    {isEditMode ? (
                      <>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsEditMode(false)}
                          className="border border-slate-200 rounded-xl px-6 text-gray-600 hover:bg-slate-50"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Security / Danger Zone */}
            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Password Change Box */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-5">
                  <h2 className="text-lg font-bold text-gray-900 border-b border-slate-50 pb-3 flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-emerald-600" />
                    Change Password
                  </h2>

                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="currentPassword text-xs font-semibold text-gray-500 uppercase">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-5"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="newPassword text-xs font-semibold text-gray-500 uppercase">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 py-5"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Must be at least 6 characters with 1 capital and 1 digit.</p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isPasswordSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl mt-2"
                    >
                      {isPasswordSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      Update Password
                    </Button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50/20 border border-red-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-5">
                  <h2 className="text-lg font-bold text-red-700 border-b border-red-100/50 pb-3 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                    Danger Zone
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Deleting your account is permanent. This will remove your user document profile, all listings associated with your account, and cannot be undone.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 hover:bg-red-750 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 py-5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account Permanent
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-50">
              <h3 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                Confirm Account Deletion
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                This action is irreversible. To proceed, please type <span className="font-bold text-gray-800 uppercase">DELETE</span> below.
              </p>
              <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  required
                  className="rounded-xl border-red-200 focus:border-red-500 focus:ring-red-500 py-5"
                />
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText("");
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || deleteConfirmText !== "DELETE"}
                    className="bg-red-600 hover:bg-red-750 hover:bg-red-700 text-white rounded-xl"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
