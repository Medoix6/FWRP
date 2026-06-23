"use client";

export const dynamic = "force-dynamic";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Home,
  MessageCircle,
  User,
  LogOut,
  Menu,
  Gift,
  Settings,
  MapPin,
  Filter,
  CheckCircle2,
  Shield,
  Star,
  PlusCircle,
  Heart,
  TrendingUp,
  Inbox,
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/app/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { listingsService } from "@/services/listingsService";
import { AuthTokenManager } from "@/lib/clientAuth";
import { getCsrfHeaders } from "@/lib/clientCsrf";
import { logout } from "@/lib/logout";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

// Skeleton loader components
const SkeletonCard = () => (
  <Card className="overflow-hidden rounded-3xl border border-emerald-100/60 bg-white shadow-sm p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-4">
      <div className="rounded-full bg-slate-200 h-10 w-10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-200 rounded w-1/4" />
      </div>
    </div>
    <div className="h-48 bg-slate-100 rounded-2xl mb-4 w-full" />
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 rounded w-5/6" />
      <div className="h-4 bg-slate-200 rounded w-2/3" />
    </div>
  </Card>
);

interface DonatedFoodType {
  id: string;
  avatar?: string;
  foodName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  description?: string;
  userId?: string;
  location?: string;
  locationCoords?: { lat: number; lng: number } | null;
  expiryDate?: string;
  pickupInstructions?: string;
  category?: string;
  quantityServings?: number | null;
  allergens?: string[];
  packaging?: string;
  pickupWindowStart?: string;
  pickupWindowEnd?: string;
  status?: "available" | "reserved" | "picked_up" | "expired" | "cancelled" | "removed";
  reservedBy?: string | null;
  userName?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [donatedFood, setDonatedFood] = useState<DonatedFoodType[]>([]);
  const [donorProfiles, setDonorProfiles] = useState<Record<string, { phone?: string; isVerified?: boolean; ratingAverage?: number; ratingCount?: number }>>({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; read: boolean; link?: string }>>([]);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [mapView, setMapView] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  const [expiryBefore, setExpiryBefore] = useState("");
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, { score: number; comment: string }>>({});
  const [ratedDonations, setRatedDonations] = useState<Record<string, boolean>>({});
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("Inaccurate listing");
  const [reportDetails, setReportDetails] = useState("");

  const refreshDonations = useCallback(async () => {
    try {
      const data = await listingsService.fetchListings();
      setDonatedFood(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load listings.");
    }
  }, []);

  // Fetch listings and profiles
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await listingsService.fetchListings();
        setDonatedFood(data || []);
        
        const userIds = (data || []).map((item: DonatedFoodType) => item.userId as string).filter(Boolean);
        const uniqueUserIds = Array.from(new Set(userIds)) as string[];
        const profiles: Record<string, { phone?: string; isVerified?: boolean; ratingAverage?: number; ratingCount?: number }> = {};
        
        await Promise.all(uniqueUserIds.map(async (userId: string) => {
          try {
            const authHeader = AuthTokenManager.getAuthHeader();
            const res = await fetch(`/api/users/${userId}`, {
              headers: {
                ...(authHeader || {}),
              },
            });
            if (res.ok) {
              const donorResponse = await res.json();
              const donor = donorResponse.data || donorResponse;
              profiles[userId] = {
                phone: donor.phone,
                isVerified: Boolean(donor.isVerified),
                ratingAverage: donor.ratingAverage || 0,
                ratingCount: donor.ratingCount || 0,
              };
            }
          } catch {}
        }));
        setDonorProfiles(profiles);

        const currentUser = auth?.currentUser;
        if (currentUser) {
          const pendingRatings = (data || [])
            .filter((item: DonatedFoodType) => item.status === "picked_up")
            .filter((item: DonatedFoodType) => item.userId === currentUser.uid || item.reservedBy === currentUser.uid);
          
          const ratingChecks = await Promise.all(pendingRatings.map(async (item: DonatedFoodType) => {
            try {
              const authHeader = AuthTokenManager.getAuthHeader();
              const res = await fetch(`/api/ratings?donationId=${item.id}`, {
                headers: {
                  ...(authHeader || {}),
                },
              });
              if (!res.ok) return { id: item.id, rated: false };
              const ratingPayload = await res.json();
              return { id: item.id, rated: Boolean(ratingPayload?.data?.rating) };
            } catch {
              return { id: item.id, rated: false };
            }
          }));
          const ratedMap: Record<string, boolean> = {};
          ratingChecks.forEach((entry) => {
            ratedMap[entry.id] = entry.rated;
          });
          setRatedDonations(ratedMap);
        }
      } catch (err: any) {
        toast.error("Failed to sync dashboard feed.");
        setDonatedFood([]);
        setDonorProfiles({});
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);



  // Fetch notifications
  useEffect(() => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return;
    
    const fetchNotifications = async () => {
      try {
        const authHeader = AuthTokenManager.getAuthHeader();
        const res = await fetch("/api/notifications", {
          headers: {
            ...(authHeader || {}),
          },
        });
        if (!res.ok) return;
        const payload = await res.json();
        const data = payload.data || payload;
        setNotifications(data.notifications || []);
        setNotificationUnread(data.unreadCount || 0);
      } catch {}
    };
    fetchNotifications();
  }, [auth?.currentUser]);

  const getDistanceKm = useCallback((coords: { lat: number; lng: number } | null | undefined) => {
    if (!coords || !userCoords) return null;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coords.lat - userCoords.lat);
    const dLng = toRad(coords.lng - userCoords.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userCoords.lat)) *
      Math.cos(toRad(coords.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }, [userCoords]);

  const filteredDonations = useMemo(() => {
    return donatedFood.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.foodName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || (item.category || "").toLowerCase() === categoryFilter.toLowerCase();
      const distance = getDistanceKm(item.locationCoords || undefined);
      const matchesDistance = !userCoords || !maxDistanceKm || distance === null || distance <= maxDistanceKm;
      const matchesExpiry = !expiryBefore || (item.expiryDate ? new Date(item.expiryDate) <= new Date(expiryBefore) : false);
      return matchesSearch && matchesStatus && matchesCategory && matchesDistance && matchesExpiry;
    });
  }, [donatedFood, searchTerm, statusFilter, categoryFilter, userCoords, maxDistanceKm, expiryBefore, getDistanceKm]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        toast.success("Location retrieved successfully!");
      },
      () => {
        toast.error("Unable to retrieve location.");
      }
    );
  };

  const handleDonationAction = async (donationId: string, actionName: string) => {
    const actionMap: Record<string, "reserve" | "pickup" | "cancel" | "remove"> = {
      reserve: "reserve",
      cancel_reservation: "cancel",
      mark_picked_up: "pickup",
      cancel_donation: "remove",
    };

    const targetAction = actionMap[actionName];
    if (!targetAction) return;

    try {
      await listingsService.performAction(donationId, targetAction);
      toast.success(`Action '${targetAction}' completed successfully!`);
      await refreshDonations();
    } catch (error: any) {
      toast.error(error.message || "Action failed.");
    }
  };

  const submitReport = async (donationId: string) => {
    try {
      const authHeader = AuthTokenManager.getAuthHeader();
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({
          targetType: "donation",
          targetId: donationId,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || data?.error || "Failed to submit report");
      }
      setReportingId(null);
      setReportDetails("");
      toast.success("Report submitted for review.");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
    }
  };

  const submitRating = async (donationId: string, toUserId: string) => {
    const draft = ratingDrafts[donationId];
    if (!draft?.score) {
      toast.error("Select a rating score");
      return;
    }
    try {
      const authHeader = AuthTokenManager.getAuthHeader();
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({
          donationId,
          toUserId,
          score: draft.score,
          comment: draft.comment,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || data?.error || "Failed to submit rating");
      }
      toast.success("Rating submitted!");
      setRatedDonations((prev) => ({ ...prev, [donationId]: true }));
    } catch (error: any) {
      toast.error(error.message || "Failed to submit rating");
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const authHeader = AuthTokenManager.getAuthHeader();
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
        setNotificationUnread(0);
        toast.success("Marked all notifications as read");
      }
    } catch {
      toast.error("Failed to mark notifications");
    }
  };

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const available = donatedFood.filter((f) => f.status === "available").length;
    const rescued = donatedFood.filter((f) => f.status === "picked_up").length;
    const totalCount = donatedFood.length;
    const activeDonors = Object.keys(donorProfiles).length;

    return [
      { label: "Available Donations", value: available, icon: Gift, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
      { label: "Rescued Food Items", value: rescued, icon: Heart, color: "text-rose-600 bg-rose-50 border-rose-100" },
      { label: "Total Platform Listings", value: totalCount, icon: TrendingUp, color: "text-amber-600 bg-amber-50 border-amber-100" },
      { label: "Active Contributors", value: activeDonors, icon: User, color: "text-sky-600 bg-sky-50 border-sky-100" },
    ];
  }, [donatedFood, donorProfiles]);

  const activePath: string = "/dashboard";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50/50 flex">
        {/* Mobile sidebar toggle button */}
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
        <Sidebar activePath="/dashboard" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Area */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-slate-100 py-6 px-6 sm:px-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1 font-body">Browse available community surplus food listings</p>
            </div>
            <Link href="/donate-food">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 py-5 px-4 shadow-sm hover:shadow">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Add Donation</span>
              </Button>
            </Link>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-6 sm:px-8 space-y-8">
            {/* Stats Metric Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Card key={i} className="border border-slate-100 rounded-2xl bg-white shadow-sm flex items-center p-5 gap-4">
                    <div className={`p-3.5 rounded-xl border ${stat.color} flex items-center justify-center shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                      <span className="block text-2xl font-bold text-gray-800 mt-0.5">{stat.value}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Notification Alerts */}
            {notifications.length > 0 && (
              <Card className="border border-emerald-100 bg-white shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-emerald-50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600 animate-pulse" />
                    <span className="font-bold text-gray-800 text-sm">Recent Alerts & Updates</span>
                    {notificationUnread > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationUnread}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllNotificationsRead}
                    disabled={notificationUnread === 0}
                    className="text-emerald-700 hover:text-emerald-800 text-xs hover:bg-emerald-50/50 rounded-xl"
                  >
                    Mark all read
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {notifications.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                        note.read ? "bg-slate-50/50 border-slate-100" : "bg-emerald-50/40 border-emerald-100/60"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{note.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{note.body}</div>
                      </div>
                      {note.link && (
                        <Link href={note.link}>
                          <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 text-xs hover:bg-emerald-50/50 rounded-lg">
                            Open
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Filter controls */}
            <Card className="border border-slate-100 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center gap-2 p-5 border-b border-slate-50">
                <Filter className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-gray-800 text-sm">Filter Food Options</span>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="search" className="text-xs font-semibold text-gray-500 uppercase">Keyword Search</Label>
                    <Input
                      id="search"
                      placeholder="Search food name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-slate-100 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs font-semibold text-gray-500 uppercase">Availability Status</Label>
                    <select
                      id="status"
                      className="w-full rounded-xl border border-slate-100 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-emerald-500 h-10"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="picked_up">Picked up</option>
                      <option value="expired">Expired</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs font-semibold text-gray-500 uppercase">Category</Label>
                    <select
                      id="category"
                      className="w-full rounded-xl border border-slate-100 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-emerald-500 h-10"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All categories</option>
                      <option value="produce">Produce</option>
                      <option value="cooked">Cooked</option>
                      <option value="bakery">Bakery</option>
                      <option value="pantry">Pantry</option>
                      <option value="dairy">Dairy</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="expiryBefore" className="text-xs font-semibold text-gray-500 uppercase shrink-0">Expiry before</Label>
                    <Input
                      id="expiryBefore"
                      type="date"
                      value={expiryBefore}
                      onChange={(e) => setExpiryBefore(e.target.value)}
                      className="w-44 border-slate-100 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                    />
                  </div>

                  <div className="h-5 w-px bg-slate-200 hidden sm:block" />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handleGetLocation} className="border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-700 rounded-xl">
                      <MapPin className="h-4 w-4 mr-2" />
                      Distance Filter
                    </Button>
                    {userCoords && (
                      <>
                        <Label htmlFor="distance" className="text-xs font-semibold text-gray-500 uppercase">Max (km):</Label>
                        <Input
                          id="distance"
                          type="number"
                          min={1}
                          max={100}
                          value={maxDistanceKm}
                          onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                          className="w-20 border-slate-100 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                        />
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapView(!mapView)}
                      className="border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-700 rounded-xl ml-auto"
                    >
                      {mapView ? "Show List View" : "Show Map View"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content List Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center">
                <Inbox className="h-16 w-16 mb-4 text-slate-300" />
                <p className="text-lg font-bold text-slate-700">No Food Donations Found</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  We couldn&apos;t find any listings matching your search filter options. Try adjusting filters or add a new donation.
                </p>
                <Link href="/donate-food" className="mt-6">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDonations.map((item: DonatedFoodType) => {
                  const isOwner = item.userId === auth?.currentUser?.uid;
                  const isReservedByUser = item.reservedBy === auth?.currentUser?.uid;
                  const statusLabel = item.status || "available";
                  const distance = getDistanceKm(item.locationCoords || undefined);
                  const donorProfile = item.userId ? donorProfiles[item.userId] : undefined;
                  const ratingTargetId = isOwner ? item.reservedBy : item.userId;

                  return (
                    <Card key={item.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <CardHeader className="p-5 flex flex-row items-center space-x-4 border-b border-slate-50">
                          <Avatar className="h-10 w-10 border border-slate-100">
                            <AvatarImage src={item.avatar || ""} alt="User Avatar" />
                            <AvatarFallback className="bg-emerald-50 text-emerald-800 font-bold">
                              {item.userName ? item.userName[0].toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-800 text-sm">{item.userName || "Contributor"}</span>
                              {donorProfile?.isVerified && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                  Verified
                                </span>
                              )}
                            </div>
                            {donorProfile?.ratingCount ? (
                              <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400 mr-0.5" />
                                {donorProfile.ratingAverage?.toFixed(1)} ({donorProfile.ratingCount} reviews)
                              </div>
                            ) : null}
                          </div>
                          
                          {/* Badges / Status Tags */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            statusLabel === "available"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : statusLabel === "reserved"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            {statusLabel.replace("_", " ")}
                          </span>
                        </CardHeader>

                        {/* Image/Map Section */}
                        {mapView && item.locationCoords ? (
                          <div className="w-full h-56 bg-slate-100">
                            <iframe
                              title="Donation Location Map"
                              className="w-full h-56 border-0"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://www.google.com/maps?q=${item.locationCoords.lat},${item.locationCoords.lng}&z=14&output=embed`}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-56 bg-slate-50 relative flex items-center justify-center overflow-hidden group">
                            {((item.imageUrls && item.imageUrls.length > 0) || item.imageUrl) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={(item.imageUrls && item.imageUrls[0]) || item.imageUrl || ""}
                                alt={item.foodName}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-slate-300 flex flex-col items-center">
                                <Gift className="h-12 w-12 stroke-[1.5] mb-2" />
                                <span className="text-xs">No image provided</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6 space-y-4">
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg">{item.foodName}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-3 leading-relaxed">{item.description}</p>
                          </div>

                          {item.userId && donorProfile?.phone && (
                            <div className="text-xs text-slate-600 bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                              <span className="font-semibold text-gray-700">Contact Number:</span>
                              <span className="font-mono">{donorProfile.phone}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs border-t border-slate-100 pt-4">
                            <div className="col-span-2 flex items-start gap-1">
                              <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Location:</span>
                              <span className="text-gray-700 truncate">{item.location}</span>
                            </div>
                            {distance !== null && (
                              <div className="col-span-2 flex items-center gap-1">
                                <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Distance:</span>
                                <span className="text-gray-700 font-semibold text-emerald-600">{distance} km away</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Expires:</span>
                              <span className="text-gray-700 font-semibold">{item.expiryDate || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Category:</span>
                              <span className="text-gray-700 capitalize">{item.category || "Other"}</span>
                            </div>
                            {item.quantityServings && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Servings:</span>
                                <span className="text-gray-700">{item.quantityServings}</span>
                              </div>
                            )}
                            {item.packaging && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Packaging:</span>
                                <span className="text-gray-700 truncate">{item.packaging}</span>
                              </div>
                            )}
                            {item.pickupWindowStart && item.pickupWindowEnd && (
                              <div className="col-span-2 flex items-start gap-1">
                                <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Window:</span>
                                <span className="text-gray-700">{item.pickupWindowStart} - {item.pickupWindowEnd}</span>
                              </div>
                            )}
                            {item.allergens && item.allergens.length > 0 && (
                              <div className="col-span-2 flex items-start gap-1">
                                <span className="font-semibold text-gray-400 uppercase w-20 shrink-0">Allergens:</span>
                                <span className="text-red-500 font-semibold truncate">{item.allergens.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons footer */}
                      <div className="p-6 pt-0 border-t border-slate-50 mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2 pt-4">
                          {!isOwner && item.status === "available" && (
                            <Button
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                              onClick={() => handleDonationAction(item.id, "reserve")}
                            >
                              Reserve Food
                            </Button>
                          )}
                          {!isOwner && item.userId && (
                            <Button
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 rounded-xl"
                              onClick={() => {
                                router.push(`/chat?donorId=${item.userId}&donationId=${item.id}`);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          )}
                          {isReservedByUser && item.status === "reserved" && (
                            <Button
                              className="flex-1 bg-amber-550 hover:bg-amber-600 bg-amber-500 text-white rounded-xl"
                              onClick={() => handleDonationAction(item.id, "cancel_reservation")}
                            >
                              Cancel Reservation
                            </Button>
                          )}
                          {isOwner && item.status === "reserved" && (
                            <Button
                              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl"
                              onClick={() => handleDonationAction(item.id, "mark_picked_up")}
                            >
                              Mark as Picked Up
                            </Button>
                          )}
                          {isOwner && (item.status === "available" || item.status === "reserved") && (
                            <Button
                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl"
                              onClick={() => handleDonationAction(item.id, "cancel_donation")}
                            >
                              Remove listing
                            </Button>
                          )}
                          {isOwner && (
                            <Button
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 rounded-xl"
                              onClick={() => {
                                router.push(`/edit-donation/${item.id}`);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                          {!isOwner && (
                            <Button
                              variant="ghost"
                              className="text-gray-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl"
                              onClick={() => setReportingId(reportingId === item.id ? null : item.id)}
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Report Section */}
                        {reportingId === item.id && (
                          <div className="border border-red-100 rounded-2xl p-4 space-y-3 bg-red-50/30 animate-slide-up">
                            <Label className="text-xs font-bold text-gray-500 uppercase">Reason for report</Label>
                            <select
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value)}
                            >
                              <option>Inaccurate listing</option>
                              <option>Unsafe content</option>
                              <option>Spam</option>
                              <option>Other</option>
                            </select>
                            <Textarea
                              placeholder="Please add details explaining the issue..."
                              value={reportDetails}
                              onChange={(e) => setReportDetails(e.target.value)}
                              className="rounded-xl border-slate-200 bg-white"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-lg" onClick={() => submitReport(item.id)}>
                                Send Report
                              </Button>
                              <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setReportingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Rating section */}
                        {item.status === "picked_up" && ratingTargetId && !ratedDonations[item.id] && (
                          <div className="border border-emerald-100 rounded-2xl p-4 space-y-3 bg-emerald-50/30">
                            <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              Rate your transaction experience
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white shrink-0"
                                value={ratingDrafts[item.id]?.score || 0}
                                onChange={(e) => setRatingDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: { score: Number(e.target.value), comment: prev[item.id]?.comment || "" },
                                }))}
                              >
                                <option value={0}>Score (1-5)</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                              </select>
                              <Input
                                placeholder="Add comments about donor behavior..."
                                value={ratingDrafts[item.id]?.comment || ""}
                                onChange={(e) => setRatingDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: { score: prev[item.id]?.score || 0, comment: e.target.value },
                                }))}
                                className="rounded-xl border-slate-200 bg-white"
                              />
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl" onClick={() => submitRating(item.id, ratingTargetId)}>
                                Submit
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Overlay for mobile sidebar navigation */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
