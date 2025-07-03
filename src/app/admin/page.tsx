"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, LogOut, Menu, Settings, Shield, Edit2, Trash2 } from "lucide-react"
import { db } from "@/app/firebase"
import { collection, getDocs } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAuth, onAuthStateChanged } from "firebase/auth"


// User type for admin dashboard
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

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData: UserType[] = querySnapshot.docs.map((doc) => {
          const data = doc.data() as UserType;
          return {
            id: doc.id,
            name: data.name || "",
            email: data.email || "",
            avatar: data.avatar || "",
            avatarSrc: data.avatar || "",
          };
        });
        setUsers(usersData);
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
        const userDoc = await getDocs(collection(db, "users"));
        const adminDoc = userDoc.docs.find(doc => doc.id === firebaseUser.uid);
        if (adminDoc && adminDoc.data().avatar) {
          setAdminAvatar(adminDoc.data().avatar);
        } else {
          setAdminAvatar("");
        }
      } else {
        setAdminAvatar("");
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);



  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId) || null;
    setEditUser(user);
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
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editUser.id, name: editUser.name, email: editUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, name: editUser.name, email: editUser.email } : u)));
      setSuccessMsg("User updated successfully.");
      setEditUser(null);
    } catch (e) {
      if (e instanceof Error) setEditError(e.message);
      else setEditError("Unknown error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId) || null;
    setDeleteUser(user);
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
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ id: deleteUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setSuccessMsg("User deleted successfully.");
      setDeleteUser(null);
    } catch (e) {
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
                <AvatarImage src={adminAvatar || "/placeholder.svg?height=80&width=80"} alt="Admin" />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-medium">Admin User</h3>
                <p className="text-sm text-gray-500">admin@fwrp.com</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              <Link href="/admin" className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md">
                <Shield className="h-5 w-5 mr-3" />
                Admin Dashboard
              </Link>
              <Link href="/edit-profile" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                <Settings className="h-5 w-5 mr-3" />
                Edit Profile
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                try {
                  const auth = getAuth();
                  await auth.signOut();
                  window.location.href = "/login";
                } catch (err) {
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">User Management</h2>
                <p className="text-gray-500 mt-1">View and manage all users in the system</p>
              </div>

              {successMsg && (
                <div className="p-4 text-green-700 bg-green-100 border border-green-300 mb-2 rounded">{successMsg}</div>
              )}
              {/* User table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar>
                                <AvatarImage src={user.avatarSrc || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.id)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to{" "}
                      <span className="font-medium">{users.length}</span> of{" "}
                      <span className="font-medium">{users.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button
                        variant="outline"
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        1
                      </Button>
                      <Button
                        variant="outline"
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" value={editUser.name || ""} onChange={handleEditUserChange} />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" value={editUser.email || ""} onChange={handleEditUserChange} />
              </div>
              {editError && <div className="text-red-600">{editError}</div>}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setEditUser(null)} disabled={editLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditUserSave} disabled={editLoading}>
                {editLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Delete User</h3>
            <p>
              Are you sure you want to delete{" "}
              <span className="font-bold">{deleteUser.name}</span>? This action cannot be undone.
            </p>
            {deleteError && <div className="text-red-600 mt-2">{deleteError}</div>}
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setDeleteUser(null)} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUserConfirm} disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

    </div>
  );
}
