"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Home, MessageCircle, User, LogOut, Menu, Gift, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import CloudinaryAvatar from "@/components/ui/CloudinaryAvatar"
import { getUserProfile, fetchDonatedFood } from "@/controllers/dashboardController"

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ displayName: string | null, email: string | null, fullName?: string | null, avatar?: string | null }>({ displayName: null, email: null, avatar: null })
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    avatar: ""
  })
  const [donatedFood, setDonatedFood] = useState<any[]>([])
  const [donorPhones, setDonorPhones] = useState<{ [userId: string]: string }>({});
  const [loading, setLoading] = useState(true)

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
        // Not authenticated, redirect to login
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await fetchDonatedFood();
        setDonatedFood(data.donations || []);
        // Fetch phone numbers for each donor
        const userIds = (data.donations || []).map((item: any) => item.userId).filter(Boolean);
        const uniqueUserIds = Array.from(new Set(userIds)) as string[];
        const phones: { [userId: string]: string } = {};
        await Promise.all(uniqueUserIds.map(async (userId: string) => {
          try {
            const res = await fetch(`/api/users/${userId}`);
            if (res.ok) {
              const donor = await res.json();
              if (donor.phone) {
                phones[userId] = donor.phone;
              }
            }
          } catch {}
        }));
        setDonorPhones(phones);
      } catch (e) {
        setDonatedFood([]);
        setDonorPhones({});
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);


  if (loading || !profileData.fullName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500 text-lg">Loading dashboard...</div>
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
                Show Profile
              </Link>
              <Link href="/dashboard" className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md">
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
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                try {
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-500">Loading donated food...</div>
            ) : donatedFood.length === 0 ? (
              <div className="text-center text-gray-500">No food has been donated yet.</div>
            ) : (
              donatedFood.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="p-4 flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={item.avatar || "/placeholder.svg?height=80&width=80"} alt={item.foodName || "Donator"} />
                      <AvatarFallback>{item.foodName ? item.foodName[0].toUpperCase() : "?"}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold flex-1 text-center">{item.foodName}</span>
                  </CardHeader>
                  <CardContent className="p-0">
                    <img src={item.imageUrl || "/placeholder.svg"} alt="Food" className="w-full h-auto" />
                    <div className="p-4">
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      {/* Show phone number above location if available */}
                      {donorPhones[item.userId] && (
                        <div className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold text-green-700">Phone:</span> {donorPhones[item.userId]}
                        </div>
                      )}
                      <p className="text-gray-500 text-sm mb-2"><span className="font-semibold text-green-700">Location:</span> {item.location}</p>
                      <p className="text-gray-500 text-sm mb-2"><span className="font-semibold text-green-700">Expiry:</span> {item.expiryDate || "N/A"}</p>
                      <p className="text-gray-500 text-sm mb-4"><span className="font-semibold text-green-700">Pickup:</span> {item.pickupInstructions || "N/A"}</p>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-center">
                          {item.userId !== user?.email && item.userId !== auth.currentUser?.uid && (
                            <Button className="w-full sm:w-auto" onClick={async () => {
                              // Open WhatsApp chat
                              const phone = donorPhones[item.userId]?.replace(/[^\d+]/g, '');
                              if (!phone) {
                                alert('No phone number available for this donor.');
                                return;
                              }
                              const url = `https://wa.me/${phone}`;
                              window.open(url, '_blank');
                            }}>
                              <MessageCircle className="h-5 w-5 mr-2" />
                              Contact Donator
                            </Button>
                          )}
                          {item.userId === user?.email || item.userId === auth.currentUser?.uid ? (
                            <Button
                              className="w-full sm:w-auto ml-2 bg-blue-500 hover:bg-blue-600"
                              onClick={() => {
                                // Redirect to edit page for this donation (dynamic route)
                                window.location.href = `/edit-donation/${item.id}`;
                              }}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {item.userId === user?.email || item.userId === auth.currentUser?.uid ? (
                            <Button
                              className="w-full sm:w-auto ml-2 bg-red-500 hover:bg-red-600"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this donation?')) {
                                  try {
                                    const res = await fetch(`/api/donated-food?id=${item.id}`, {
                                      method: 'DELETE',
                                    });
                                    if (!res.ok) throw new Error('Failed to delete');
                                    setDonatedFood((prev) => prev.filter((f) => f.id !== item.id));
                                  } catch (e) {
                                    alert('Error deleting donation');
                                  }
                                }
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
