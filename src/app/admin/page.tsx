"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogOut, Menu, Settings, Shield, Edit2, Trash2, X, Users, FileText, LayoutDashboard } from "lucide-react"
import { AuthTokenManager } from "@/lib/clientAuth"
import { getCsrfHeaders } from "@/lib/clientCsrf"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { Bar } from "react-chartjs-2";
import { LoadingSpinner } from "@/components/Loading"
import { logout } from "@/lib/logout"
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
  name: string;
  email: string;
  avatar?: string;
  avatarSrc?: string;
};

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  useEffect(() => {
    const fetchUsers = async () => {
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
        }));
        setUsers(usersData);

        // Fetch posts count via API
        const postsRes = await fetch("/api/donated-food", {
          headers: {
            ...(authHeader || {}),
          },
        });
        const postsData = await postsRes.json();
        if (!postsRes.ok) {
          throw new Error(postsData?.error?.message || "Failed to fetch donations");
        }
        setPostCount(postsData?.data?.donations?.length || 0);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
    setEditUser(users.find((u) => u.id === userId) || null);
    setEditError(null);
    setSuccessMsg(null);
  };

  const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editUser) return;
    const { name, value } = e.target;
    setEditUser({ ...editUser, [name]: value });
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
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setSuccessMsg("User deleted successfully.");
      setDeleteUser(null);
    } catch (e: unknown) {
      if (e instanceof Error) setDeleteError(e.message);
      else setDeleteError("Unknown error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)} className="bg-white">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-green-600">FWRP Admin</h2>
          </div>

          <div className="flex-1 py-6 px-4 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={adminAvatar || "/placeholder.svg?height=80&width=80"} alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-medium">Admin User</h3>
                <p className="text-sm text-gray-500">admin@fwrp.com</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              <Link
                href="/admin"
                className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md"
              >
                <LayoutDashboard className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link
                href="/edit-profile"
                className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100"
              >
                <Settings className="h-5 w-5 mr-3" />
                Profile Settings
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Total Users</div>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-gray-500">
                  Active accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">Total Posts</div>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{postCount}</div>
                <p className="text-xs text-gray-500">
                  Food donation posts
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

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b">
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
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatarSrc || "/placeholder.svg"} />
                                <AvatarFallback>{user.name[0]?.toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditUser(user.id)} className="h-8 w-8 text-gray-500 hover:text-gray-900">
                                <Edit2 className="h-4 w-4" />
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
