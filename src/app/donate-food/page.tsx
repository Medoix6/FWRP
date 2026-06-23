"use client";

export const dynamic = "force-dynamic";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Gift,
  User,
  LogOut,
  Menu,
  ArrowLeft,
  Settings,
  MessageCircle,
  MapPin,
  Loader2,
  Upload,
  X,
  CheckCircle2,
  Star,
  Eye,
  PlusCircle,
  Shield
} from "lucide-react";
import { auth, db } from "@/app/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { listingsService } from "@/services/listingsService";
import { logout } from "@/lib/logout";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

interface FormDataType {
  title: string;
  description: string;
  location: string;
  expiryDate: string;
  pickupInstructions: string;
  category: string;
  quantityServings: string;
  allergens: string;
  packaging: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
}

interface ImagePreview {
  id: string;
  preview: string;
  file: File;
}

export default function DonateFood() {
  const router = useRouter();
  const { userProfile } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    location: "",
    expiryDate: "",
    pickupInstructions: "",
    category: "other",
    quantityServings: "",
    allergens: "",
    packaging: "",
    pickupWindowStart: "",
    pickupWindowEnd: "",
  });
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 4 - imagePreviews.length;
      const newImages = Array.from(files).slice(0, remainingSlots);
      
      newImages.forEach((file) => {
        // Enforce 5MB limit
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image ${file.name} is too large. Max size is 5MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => {
            if (prev.length < 4) {
              return [
                ...prev,
                {
                  id: Math.random().toString(36).substring(2, 9),
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
      
      e.target.value = "";
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setLocationCoords({ lat: latitude, lng: longitude });
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              location: data.display_name,
            }));
            toast.success("Location updated successfully!");
          }
        } catch {
          toast.error("Failed to get location address");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  const removeImage = (id: string) => {
    setImagePreviews((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (imagePreviews.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    setIsSubmitting(true);
    try {
      await listingsService.createListing({
        foodName: formData.title,
        description: formData.description,
        location: formData.location,
        expiryDate: formData.expiryDate,
        images: imagePreviews.map((p) => p.file),
        pickupInstructions: formData.pickupInstructions,
        category: formData.category,
        quantityServings: formData.quantityServings ? Number(formData.quantityServings) : undefined,
        allergens: formData.allergens,
        packaging: formData.packaging,
        pickupWindowStart: formData.pickupWindowStart,
        pickupWindowEnd: formData.pickupWindowEnd,
        locationLat: locationCoords?.lat,
        locationLng: locationCoords?.lng,
      });

      toast.success("Food donation listing created!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to create donation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePath: string = "/donate-food";

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
        <Sidebar activePath="/donate-food" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <header className="bg-white border-b border-slate-100 py-6 px-6 sm:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">Donate Food</h1>
              <p className="text-sm text-gray-500 mt-1 font-body">Share surplus food items with individuals in need</p>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-600 hover:text-emerald-700 flex items-center gap-2 hover:bg-emerald-50/50 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-6 sm:px-8">
            {/* Split layout: form on left, preview on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form panel */}
              <div className="lg:col-span-7 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
                <h2 className="text-lg font-bold text-gray-900 border-b border-slate-50 pb-3 flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-emerald-600" />
                  Listing Details
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="title" className="text-xs font-semibold text-gray-500 uppercase">Food Name *</Label>
                      <Input
                        id="title"
                        name="title"
                        type="text"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Freshly Baked Croissants"
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="description" className="text-xs font-semibold text-gray-500 uppercase">Description *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Provide details about the food, condition, and contents..."
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="location" className="text-xs font-semibold text-gray-500 uppercase">Location *</Label>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isLocating}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
                          Use Current Location
                        </button>
                      </div>
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        required
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Enter pickup address details..."
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="category" className="text-xs font-semibold text-gray-500 uppercase">Category</Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-emerald-500 h-10"
                      >
                        <option value="produce">Produce</option>
                        <option value="cooked">Cooked Food</option>
                        <option value="bakery">Bakery</option>
                        <option value="pantry">Pantry Items</option>
                        <option value="dairy">Dairy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="expiryDate" className="text-xs font-semibold text-gray-500 uppercase">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="date"
                        required
                        value={formData.expiryDate}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="quantityServings" className="text-xs font-semibold text-gray-500 uppercase">Servings Count</Label>
                      <Input
                        id="quantityServings"
                        name="quantityServings"
                        type="number"
                        min={1}
                        value={formData.quantityServings}
                        onChange={handleChange}
                        placeholder="e.g. 5"
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="packaging" className="text-xs font-semibold text-gray-500 uppercase">Packaging Type</Label>
                      <Input
                        id="packaging"
                        name="packaging"
                        type="text"
                        value={formData.packaging}
                        onChange={handleChange}
                        placeholder="e.g. Plastic container"
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pickupWindowStart" className="text-xs font-semibold text-gray-500 uppercase">Window Start</Label>
                      <Input
                        id="pickupWindowStart"
                        name="pickupWindowStart"
                        type="time"
                        value={formData.pickupWindowStart}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pickupWindowEnd" className="text-xs font-semibold text-gray-500 uppercase">Window End</Label>
                      <Input
                        id="pickupWindowEnd"
                        name="pickupWindowEnd"
                        type="time"
                        value={formData.pickupWindowEnd}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="allergens" className="text-xs font-semibold text-gray-500 uppercase">Allergens list</Label>
                      <Input
                        id="allergens"
                        name="allergens"
                        type="text"
                        value={formData.allergens}
                        onChange={handleChange}
                        placeholder="e.g. Nuts, Dairy, Gluten (comma separated)"
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="pickupInstructions" className="text-xs font-semibold text-gray-500 uppercase">Pickup Instructions</Label>
                      <Textarea
                        id="pickupInstructions"
                        name="pickupInstructions"
                        rows={2}
                        value={formData.pickupInstructions}
                        onChange={handleChange}
                        placeholder="Details about parking, entry codes, buzzer..."
                        className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Image Upload Zone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Upload Images * (Max 4)</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {imagePreviews.map((img) => (
                        <div key={img.id} className="relative aspect-square border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.preview} alt="Upload preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {imagePreviews.length < 4 && (
                        <label className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl aspect-square flex flex-col justify-center items-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/10">
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-wide">Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting donation...
                      </>
                    ) : (
                      "Create Food Donation"
                    )}
                  </Button>
                </form>
              </div>

              {/* Real-time card preview panel */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                <h2 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-emerald-600" />
                  Live Preview
                </h2>

                <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <CardHeader className="p-5 flex flex-row items-center space-x-4 border-b border-slate-50 bg-slate-50/10">
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={userProfile?.avatar || ""} alt="User Avatar" />
                        <AvatarFallback className="bg-emerald-50 text-emerald-800 font-bold">
                          {userProfile?.name ? userProfile.name[0].toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800 text-sm block">{userProfile?.name || "Your Profile Name"}</span>
                        <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/60 mt-0.5">
                          Donor Profile
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Available
                      </span>
                    </CardHeader>

                    {/* Preview Image Carousel/Container */}
                    <div className="w-full h-52 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                      {imagePreviews.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreviews[0].preview}
                          alt="Listing Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center p-6 text-center">
                          <Upload className="h-10 w-10 stroke-[1.5] mb-2" />
                          <span className="text-xs">Upload images to display preview</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {formData.title || "Food Name Title"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-3 leading-relaxed">
                          {formData.description || "The food listing description will go here..."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs border-t border-slate-100 pt-4">
                        <div className="col-span-2 flex items-start gap-1">
                          <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Location:</span>
                          <span className="text-gray-700 truncate">{formData.location || "Pickup Address Location"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Expires:</span>
                          <span className="text-gray-700 font-semibold">{formData.expiryDate || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Category:</span>
                          <span className="text-gray-700 capitalize">{formData.category}</span>
                        </div>
                        {formData.quantityServings && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Servings:</span>
                            <span className="text-gray-700">{formData.quantityServings}</span>
                          </div>
                        )}
                        {formData.packaging && (
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Packaging:</span>
                            <span className="text-gray-700 truncate">{formData.packaging}</span>
                          </div>
                        )}
                        {formData.pickupWindowStart && formData.pickupWindowEnd && (
                          <div className="col-span-2 flex items-start gap-1">
                            <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Window:</span>
                            <span className="text-gray-700">{formData.pickupWindowStart} - {formData.pickupWindowEnd}</span>
                          </div>
                        )}
                        {formData.allergens && (
                          <div className="col-span-2 flex items-start gap-1">
                            <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Allergens:</span>
                            <span className="text-red-500 font-semibold truncate">{formData.allergens}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-50 mt-4">
                    <div className="flex gap-2 pt-4">
                      <Button disabled className="flex-1 bg-emerald-600 text-white rounded-xl">
                        Reserve Food
                      </Button>
                      <Button disabled variant="outline" className="rounded-xl">
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
