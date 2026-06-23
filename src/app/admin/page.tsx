"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, ChangeEvent } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, Menu, Settings, Shield, Edit2, Trash2, X, Users, FileText, LayoutDashboard, CheckCircle2, AlertTriangle } from "lucide-react"
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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <Sidebar activePath="/admin" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} adminContext={true} />

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Overview and moderation tools</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <Input placeholder="Search users, donations, reports..." className="min-w-[260px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Button variant="outline" onClick={loadData}>Refresh</Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={adminAvatar || "/placeholder.svg?height=40&width=40"} alt="Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm"> 
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Total Users</div>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.userCount ?? users.length}</div>
                <p className="text-xs text-gray-500">
                  Active accounts
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Total Posts</div>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.donationCount ?? postCount}</div>
                <p className="text-xs text-gray-500">
                  Food donation posts
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Picked Up</div>
                <CheckCircle2 className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.pickedUpCount ?? 0}</div>
                <p className="text-xs text-gray-500">
                  Completed pickups
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Avg Pickup Time</div>
                <AlertTriangle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.avgPickupMinutes ?? 0}m</div>
                <p className="text-xs text-gray-500">
                  Time from post to pickup
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts & Graphs Row */}
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <div className="text-lg font-semibold">Overview</div>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Bar
                    data={{
                      labels: ["Users", "Posts"],
                      datasets: [
                        {
                          label: "Count",
                          data: [users.length, postCount],
                          backgroundColor: ["#22c55e", "#3b82f6"],
                          borderRadius: 4,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: "rgba(0,0,0,0.05)" }
                        },
                        x: {
                          grid: { display: false }
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
            <h2 className="text-xl font-semibold tracking-tight">User Management</h2>
            {successMsg && (
              <div className="p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg text-sm flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                {successMsg}
              </div>
            )}

            <Card className="rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <LoadingSpinner />
                            <span className="text-gray-600">Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatarSrc || "/placeholder.svg"} />
                                <AvatarFallback>{(user.name?.[0] || "U").toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                              {user.isVerified && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)} className="h-8 w-8 text-gray-500 hover:text-gray-900">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleVerify(user.id, !user.isVerified)}
                                className="h-8 w-8 text-gray-500 hover:text-emerald-600"
                                title={user.isVerified ? "Remove verification" : "Verify user"}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination (Simplified) */}
              {!loading && users.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                  <div className="text-xs text-gray-500">
                    Showing <strong>{users.length}</strong> users
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Donation Moderation */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Donation Moderation</h2>
            <Card className="rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Donation</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No donations found.</td>
                      </tr>
                    ) : (
                      filteredDonations.map((donation) => (
                        <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium">{donation.foodName || "Donation"}</div>
                            <div className="text-xs text-gray-500">{donation.userName || donation.userId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              {donation.status || "available"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={moderationLoading}
                                onClick={() => handleModerateDonation(donation.id, "expire")}
                              >
                                Expire
                              </Button>
                              {donation.status === "removed" ? (
                                <Button size="sm" variant="outline" disabled={moderationLoading} onClick={() => handleModerateDonation(donation.id, "restore")}>
                                  Restore
                                </Button>
                              ) : (
                                <Button size="sm" variant="destructive" disabled={moderationLoading} onClick={() => handleModerateDonation(donation.id, "remove")}>
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
            <h2 className="text-xl font-semibold tracking-tight">Reports</h2>
            <Card className="rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Target</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No reports yet.</td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium">{report.targetType}</div>
                            <div className="text-xs text-gray-500">{report.targetId}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">{report.reason}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              {report.status || "open"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleReportStatus(report.id, "reviewing")}>Review</Button>
                              <Button size="sm" variant="outline" onClick={() => handleReportStatus(report.id, "resolved")}>Resolve</Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="font-semibold text-lg">Edit User</div>
              <Button variant="ghost" size="icon" onClick={() => setEditUser(null)} className="h-6 w-6 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input id="edit-name" name="name" value={editUser.name || ""} onChange={handleEditUserChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" name="email" value={editUser.email || ""} onChange={handleEditUserChange} />
              </div>
              {editError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{editError}</div>}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditUser(null)} disabled={editLoading}>
                  Cancel
                </Button>
                <Button onClick={handleEditUserSave} disabled={editLoading} className="bg-green-600 hover:bg-green-700">
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 border-red-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-red-600 font-semibold mb-1">
                <Shield className="h-5 w-5" />
                Confirm Deletion
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <span className="font-medium text-gray-900">{deleteUser.name}</span>?
                This action is permanent and cannot be undone.
              </p>

              {deleteError && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{deleteError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeleteUser(null)} disabled={deleteLoading}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteUserConfirm} disabled={deleteLoading}>
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
