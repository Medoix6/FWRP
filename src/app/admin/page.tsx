"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, ChangeEvent } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  LogOut, 
  Menu, 
  Settings, 
  Shield, 
  Edit2, 
  Trash2, 
  X, 
  Users, 
  FileText, 
  LayoutDashboard, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  Calendar,
  CheckCircle,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import { AuthTokenManager } from "@/lib/clientAuth"
import { getCsrfHeaders } from "@/lib/clientCsrf"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { Bar } from "react-chartjs-2";
import { LoadingSpinner } from "@/components/Loading"
import { logout } from "@/lib/logout"
import Sidebar from "@/components/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type UserType = {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  avatarSrc?: string;
  isVerified?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
};

type DonationRow = {
  id: string;
  foodName?: string;
  status?: string;
  createdAt?: string;
  userId?: string;
  userName?: string;
};

type ReportRow = {
  id: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
};

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [adminAvatar, setAdminAvatar] = useState<string>("");
  const [postCount, setPostCount] = useState<number>(0);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [analytics, setAnalytics] = useState<{ userCount: number; donationCount: number; pickedUpCount: number; avgPickupMinutes: number } | null>(null);
  const [moderationLoading, setModerationLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const authHeader = AuthTokenManager.getAuthHeader();
      const usersRes = await fetch("/api/users", {
        headers: {
          ...(authHeader || {}),
        },
      });
      const usersPayload = await usersRes.json();
      if (!usersRes.ok) {
        throw new Error(usersPayload?.error?.message || "Failed to fetch users");
      }
      const usersData: UserType[] = (usersPayload.data?.users || []).map((user: UserType) => ({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        avatar: user.avatar || "",
        avatarSrc: user.avatar || "",
        isVerified: Boolean(user.isVerified),
        ratingAverage: user.ratingAverage || 0,
        ratingCount: user.ratingCount || 0,
      }));
      setUsers(usersData);

      const analyticsRes = await fetch("/api/admin/analytics", {
        headers: {
          ...(authHeader || {}),
        },
      });
      if (analyticsRes.ok) {
        const analyticsPayload = await analyticsRes.json();
        const analyticsData = analyticsPayload.data || analyticsPayload;
        setAnalytics(analyticsData);
        setPostCount(analyticsData?.donationCount || 0);
      }

      const donationsRes = await fetch("/api/admin/donations", {
        headers: {
          ...(authHeader || {}),
        },
      });
      if (donationsRes.ok) {
        const donationsPayload = await donationsRes.json();
        const donationData = donationsPayload.data || donationsPayload;
        setDonations(donationData.donations || []);
      }

      const reportsRes = await fetch("/api/reports", {
        headers: {
          ...(authHeader || {}),
        },
      });
      if (reportsRes.ok) {
        const reportsPayload = await reportsRes.json();
        const reportData = reportsPayload.data || reportsPayload;
        setReports(reportData.reports || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authHeader = AuthTokenManager.getAuthHeader();
        const adminRes = await fetch(`/api/users/${firebaseUser.uid}`, {
          headers: {
            ...(authHeader || {}),
          },
        });
        const adminData = await adminRes.json();
        const profile = adminData.data || {};
        setAdminAvatar(profile.avatar || "");
      } else {
        setAdminAvatar("");
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []); 

  const handleEditUser = (userId: string) => {
    const selectedUser = users.find((u) => u.id === userId) || null;
    setEditUser(selectedUser ? { ...selectedUser } : null);
    setEditError(null);
    setSuccessMsg(null);
  };

  const handleEditUserChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setEditUser((current) => {
      if (!current) return current;
      if (name === "name") return { ...current, name: value };
      if (name === "email") return { ...current, email: value };
      return current;
    });
  };

  const handleEditUserSave = async () => {
    if (!editUser) return;

    setEditLoading(true);
    setEditError(null);
    setSuccessMsg(null);

    try {
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(AuthTokenManager.getAuthHeader() || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({ id: editUser.id, name: editUser.name, email: editUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data.error || "Failed to update user");
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, name: editUser.name, email: editUser.email } : u)));
      setSuccessMsg("User updated successfully.");
      setEditUser(null);
    } catch (e: unknown) {
      if (e instanceof Error) setEditError(e.message);
      else setEditError("Unknown error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteUser(users.find((u) => u.id === userId) || null);
    setDeleteError(null);
    setSuccessMsg(null);
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    setDeleteError(null);
    setSuccessMsg(null);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not signed in");
      const token = await currentUser.getIdToken();
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...csrfHeaders,
        },
      body: JSON.stringify({ id: deleteUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data.error || "Failed to delete user");
      setSuccessMsg("User deleted successfully.");
      setDeleteUser(null);
    } catch (e: unknown) {
      if (e instanceof Error) setDeleteError(e.message);
      else setDeleteError("Unknown error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleVerify = async (userId: string, isVerified: boolean) => {
    try {
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(AuthTokenManager.getAuthHeader() || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({ id: userId, isVerified }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data.error || "Failed to update verification");
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isVerified } : u)));
    } catch (error) {
      console.error("Failed to update verification:", error);
    }
  };

  const handleModerateDonation = async (donationId: string, action: "remove" | "restore" | "expire") => {
    try {
      setModerationLoading(true);
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/admin/donations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(AuthTokenManager.getAuthHeader() || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({ id: donationId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data.error || "Failed to update donation");
      setDonations((prev) => prev.map((d) => (d.id === donationId ? { ...d, status: action === "remove" ? "removed" : action === "expire" ? "expired" : "available" } : d)));
    } catch (error) {
      console.error("Failed to moderate donation:", error);
    } finally {
      setModerationLoading(false);
    }
  };

  const handleReportStatus = async (reportId: string, status: "open" | "reviewing" | "resolved") => {
    try {
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(AuthTokenManager.getAuthHeader() || {}),
          ...csrfHeaders,
        },
        body: JSON.stringify({ id: reportId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data.error || "Failed to update report");
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    } catch (error) {
      console.error("Failed to update report:", error);
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (!normalizedSearchTerm) return true;
    return (user.name || "").toLowerCase().includes(normalizedSearchTerm) || (user.email || "").toLowerCase().includes(normalizedSearchTerm);
  });
  const filteredDonations = donations.filter((donation) => {
    if (!normalizedSearchTerm) return true;
    return (donation.foodName || "").toLowerCase().includes(normalizedSearchTerm) || (donation.userName || "").toLowerCase().includes(normalizedSearchTerm);
  });
  const filteredReports = reports.filter((report) => {
    if (!normalizedSearchTerm) return true;
    return (report.reason || "").toLowerCase().includes(normalizedSearchTerm) || (report.targetType || "").toLowerCase().includes(normalizedSearchTerm);
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-neutral-950 flex transition-colors duration-500 text-slate-800 dark:text-slate-100 font-sans">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 shadow-sm">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <Sidebar activePath="/admin" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} adminContext={true} />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-neutral-800/80 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">Overview and moderation tools</p>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-neutral-500" />
                  <Input 
                    placeholder="Search dashboard..." 
                    className="pl-9 min-w-full sm:min-w-[280px] bg-slate-50/50 dark:bg-neutral-955 border-slate-200 dark:border-neutral-850 focus-visible:ring-emerald-500" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={loadData}
                  disabled={loading}
                  className="border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 dark:hover:bg-neutral-850 hover:bg-slate-50/80 transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`h-4.5 w-4.5 text-slate-500 dark:text-neutral-400 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Avatar className="h-9 w-9 border border-slate-200 dark:border-neutral-800">
                  <AvatarImage src={adminAvatar || "/placeholder.svg?height=36&width=36"} alt="Admin" />
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-xs">AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 w-full">

          {/* Stats Grid */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Stat Card 1: Users */}
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Total Users</div>
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-5 px-5">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  {analytics?.userCount ?? users.length}
                </div>
                <p className="text-xs font-semibold text-emerald-650 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Active registered accounts
                </p>
              </CardContent>
            </Card>

            {/* Stat Card 2: Posts */}
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Donations Posted</div>
                <div className="h-9 w-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center transition-colors group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30">
                  <FileText className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-5 px-5">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  {analytics?.donationCount ?? postCount}
                </div>
                <p className="text-xs font-medium text-slate-400 dark:text-neutral-500 mt-1">
                  Total shared food listings
                </p>
              </CardContent>
            </Card>

            {/* Stat Card 3: Picked Up */}
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Completed Pickups</div>
                <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-5 px-5">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  {analytics?.pickedUpCount ?? 0}
                </div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  Saved meals rescued
                </p>
              </CardContent>
            </Card>

            {/* Stat Card 4: Avg Pickup Time */}
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Rescue Speed</div>
                <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30">
                  <Clock className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="pb-5 px-5">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                  {analytics?.avgPickupMinutes ?? 0}m
                </div>
                <p className="text-xs font-medium text-slate-400 dark:text-neutral-500 mt-1">
                  Average listing pickup time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts & Graphs Row */}
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-neutral-800/60 px-6 py-4">
                <div className="text-lg font-bold text-slate-800 dark:text-white">Platform Growth</div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Comparing registered users against active donation posts</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[280px] w-full flex items-center justify-center">
                  <Bar
                    data={{
                      labels: ["Registered Users", "Donation Posts"],
                      datasets: [
                        {
                          label: "Active Platform Metrics",
                          data: [users.length, postCount],
                          backgroundColor: ["rgba(16, 185, 129, 0.85)", "rgba(59, 130, 246, 0.85)"],
                          hoverBackgroundColor: ["rgba(16, 185, 129, 1)", "rgba(59, 130, 246, 1)"],
                          borderRadius: 8,
                          barThickness: 48,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          titleFont: { size: 13, family: "Space Grotesk" },
                          bodyFont: { size: 12, family: "Space Grotesk" },
                          padding: 10,
                          cornerRadius: 8,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(148, 163, 184, 0.08)" },
                          ticks: {
                            color: "rgba(148, 163, 184, 0.8)",
                            font: { family: "Space Grotesk", size: 11 }
                          }
                        },
                        x: {
                          grid: { display: false },
                          ticks: {
                            color: "rgba(148, 163, 184, 0.8)",
                            font: { family: "Space Grotesk", size: 11 }
                          }
                        }
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management Section */}
          <div className="space-y-4">
            {successMsg && (
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl text-sm flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-neutral-800/60 px-6 py-4 flex flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    User Management 
                    <span className="text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-2 py-0.5 rounded-full font-semibold">
                      {filteredUsers.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Edit, verify, or remove registered accounts</p>
                </div>
              </CardHeader>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-450 border-b border-slate-100 dark:border-neutral-800/80">
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">User Profile</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Verification Status</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <LoadingSpinner />
                            <span className="text-slate-500 dark:text-neutral-400 font-medium">Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 dark:text-neutral-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="h-8 w-8 text-slate-350 dark:text-neutral-600" />
                            <p className="font-semibold text-sm">No users found</p>
                            <p className="text-xs text-slate-400 dark:text-neutral-500">Try modifying your search query.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-neutral-900/20 transition-colors">
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 border border-slate-100 dark:border-neutral-800 shadow-xs">
                                <AvatarImage src={user.avatarSrc || ""} />
                                <AvatarFallback className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 font-extrabold text-sm">
                                  {(user.name?.[0] || "U").toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</div>
                                <div className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-755 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                                Active
                              </span>
                              {user.isVerified && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
                                  <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleEditUser(user.id)} 
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:shadow-xs transition-all"
                                title="Edit user"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleToggleVerify(user.id, !user.isVerified)}
                                className={`h-8 w-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all ${
                                  user.isVerified
                                    ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                }`}
                                title={user.isVerified ? "Remove verification badge" : "Approve verification badge"}
                              >
                                {user.isVerified ? <X className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleDeleteUser(user.id)} 
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-red-500 hover:text-red-650 hover:bg-red-55/10 dark:hover:bg-red-950/20 hover:shadow-xs transition-all"
                                title="Delete user account"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && users.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/30">
                  <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    Showing <strong className="text-slate-850 dark:text-slate-200">{filteredUsers.length}</strong> users
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 border-slate-200 dark:border-neutral-850" disabled>Previous</Button>
                    <Button variant="outline" size="sm" className="h-8 border-slate-200 dark:border-neutral-850" disabled>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Donation Moderation */}
          <div className="space-y-4">
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-neutral-800/60 px-6 py-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      Donation Moderation
                      <span className="text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-2 py-0.5 rounded-full font-semibold">
                        {filteredDonations.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Manage and expire active food donation listings</p>
                  </div>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-450 border-b border-slate-100 dark:border-neutral-800/80">
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Donation listing</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Created Date</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-neutral-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="h-8 w-8 text-slate-350 dark:text-neutral-600" />
                            <p className="font-semibold text-sm">No donations found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredDonations.map((donation) => (
                        <tr key={donation.id} className="hover:bg-slate-50/40 dark:hover:bg-neutral-900/20 transition-colors">
                          <td className="px-6 py-4 align-middle">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{donation.foodName || "Donation"}</div>
                            <div className="text-xs text-slate-400 dark:text-neutral-500 mt-1 flex items-center gap-1.5 font-medium">
                              <Users className="h-3 w-3 text-slate-400" />
                              <span>{donation.userName || donation.userId || "Anonymous"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              (donation.status || "available") === "available"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-755 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30"
                                : (donation.status === "removed")
                                ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-900/30"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-450 border-amber-100/50 dark:border-amber-900/30"
                            }`}>
                              {donation.status || "available"}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle text-xs text-slate-400 dark:text-neutral-500 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={moderationLoading}
                                onClick={() => handleModerateDonation(donation.id, "expire")}
                                className="text-xs h-8 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-350"
                              >
                                Expire
                              </Button>
                              {donation.status === "removed" ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  disabled={moderationLoading} 
                                  onClick={() => handleModerateDonation(donation.id, "restore")}
                                  className="text-xs h-8 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                                >
                                  Restore
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  disabled={moderationLoading} 
                                  onClick={() => handleModerateDonation(donation.id, "remove")}
                                  className="text-xs h-8 bg-red-600 hover:bg-red-700 border-0"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Reports Queue */}
          <div className="space-y-4">
            <Card className="border border-slate-200/60 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-neutral-800/60 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Moderation Reports
                    <span className="text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-2 py-0.5 rounded-full font-semibold">
                      {filteredReports.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Review user-submitted reports and flag violations</p>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-450 border-b border-slate-100 dark:border-neutral-800/80">
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Target Entity</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Reason</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-neutral-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-600" />
                            <p className="font-semibold text-sm">Reports queue is empty</p>
                            <p className="text-xs text-slate-400 dark:text-neutral-500">All submissions have been successfully resolved.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/40 dark:hover:bg-neutral-900/20 transition-colors">
                          <td className="px-6 py-4 align-middle">
                            <div className="font-bold text-slate-800 dark:text-slate-200 capitalize">{report.targetType}</div>
                            <div className="text-xs text-slate-400 dark:text-neutral-550 mt-1 font-mono">{report.targetId}</div>
                          </td>
                          <td className="px-6 py-4 align-middle text-xs text-slate-650 dark:text-neutral-400 italic font-medium">
                            "{report.reason}"
                          </td>
                          <td className="px-6 py-4 align-middle">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              (report.status || "open") === "resolved"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border-emerald-100/50 dark:border-emerald-900/30"
                                : (report.status === "reviewing")
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-750 dark:text-amber-450 border-amber-100/50 dark:border-amber-900/30"
                                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-450 border-red-100/50 dark:border-red-900/30"
                            }`}>
                              {report.status || "open"}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              {report.status !== "reviewing" && report.status !== "resolved" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleReportStatus(report.id, "reviewing")}
                                  className="text-xs h-8 border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-350"
                                >
                                  Review
                                </Button>
                              )}
                              {report.status !== "resolved" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleReportStatus(report.id, "resolved")}
                                  className="text-xs h-8 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400"
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-neutral-800/80 px-6 py-4">
              <div>
                <div className="font-extrabold text-lg text-slate-900 dark:text-white">Edit User Settings</div>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Modify profile values for account {editUser.id}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditUser(null)} className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-450">Display Name</Label>
                <Input id="edit-name" name="name" className="bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-850 rounded-xl" value={editUser.name || ""} onChange={handleEditUserChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-450">Email Address</Label>
                <Input id="edit-email" name="email" className="bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-850 rounded-xl" value={editUser.email || ""} onChange={handleEditUserChange} />
              </div>
              {editError && (
                <div className="text-sm text-red-600 bg-red-50/50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800/80">
                <Button variant="outline" className="rounded-xl border-slate-250 dark:border-neutral-800 bg-transparent" onClick={() => setEditUser(null)} disabled={editLoading}>
                  Cancel
                </Button>
                <Button onClick={handleEditUserSave} disabled={editLoading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md bg-white dark:bg-neutral-900 border border-red-100 dark:border-red-900/25 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 rounded-3xl">
            <CardHeader className="px-6 py-5 pb-3">
              <div className="flex items-center gap-2.5 text-red-650 dark:text-red-400 font-extrabold text-lg mb-1">
                <AlertTriangle className="h-5 w-5" />
                Confirm Account Deletion
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Are you sure you want to delete the account <span className="font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-neutral-850 px-1.5 py-0.5 rounded">{deleteUser.name}</span>?
                This action is permanent, revokes all platform access immediately, and cannot be undone.
              </p>

              {deleteError && (
                <div className="text-sm text-red-650 bg-red-50/50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-neutral-800/80">
                <Button variant="outline" className="rounded-xl border-slate-250 dark:border-neutral-800 bg-transparent" onClick={() => setDeleteUser(null)} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button variant="destructive" className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={handleDeleteUserConfirm} disabled={deleteLoading}>
                  {deleteLoading ? "Deleting..." : "Delete User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
