"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Home, MessageCircle, User, LogOut, Menu, Gift, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { getUserProfile, fetchDonatedFood } from "@/controllers/dashboardController"
import { AuthTokenManager } from "@/lib/clientAuth"
import { getCsrfHeaders } from "@/lib/clientCsrf"
import { LoadingScreen } from "@/components/Loading"
import { logout } from "@/lib/logout"

export default function Dashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ displayName: string | null, email: string | null, fullName?: string | null, avatar?: string | null }>({ displayName: null, email: null, avatar: null })
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    avatar: ""
  })
  interface DonatedFoodType {
    id: string;
    avatar?: string;
    foodName?: string;
    imageUrl?: string;
    imageUrls?: string[];
    description?: string;
    userId?: string;
    location?: string;
    expiryDate?: string;
    pickupInstructions?: string;
  }
  const [donatedFood, setDonatedFood] = useState<DonatedFoodType[]>([])
  const [donorPhones, setDonorPhones] = useState<{ [userId: string]: string }>({});
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

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
        //Check for authentication . If not authenticated, redirect to login page.
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
        const userIds = (data.donations || []).map((item: DonatedFoodType) => item.userId as string).filter(Boolean);
        const uniqueUserIds = Array.from(new Set(userIds)) as string[];
        const phones: { [userId: string]: string } = {};
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
              if (donor.phone) {
                phones[userId] = donor.phone;
              }
            }
          } catch {}
        }));
        setDonorPhones(phones);
      } catch {
        setDonatedFood([]);
        setDonorPhones({});
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Listen for unread messages
  useEffect(() => {
    if (!user.email) return;
    
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");
    const unreadQuery = query(
      messagesRef,
      where("receiverId", "==", currentUser.uid),
      where("status", "in", ["sent", "delivered"])
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user.email]);


  if (loading || !profileData.fullName) {
    return <LoadingScreen message="Loading dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-white flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="bg-white border-emerald-200 hover:bg-emerald-50">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-sm shadow-xl border-r border-emerald-100 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-lime-50">
            <h2 className="text-2xl font-bold text-emerald-600">FWRP</h2>
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
              <Link href="/edit-profile" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <Settings className="h-5 w-5 mr-3" />
                Show Profile
              </Link>
              <Link href="/dashboard" className="flex items-center p-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link href="/donate-food" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <Gift className="h-5 w-5 mr-3" />
                Donate Food
              </Link>
              <Link href="/chat" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <MessageCircle className="h-5 w-5 mr-3" />
                <span className="flex-1">Chat</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-emerald-100">
            <Button
              variant="outline"
              className="w-full justify-start border-emerald-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
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
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome back! Here are the available food donations.</p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-500 py-10">Loading donated food...</div>
            ) : donatedFood.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white/80 rounded-3xl border border-emerald-100 shadow-sm p-8">
                <Gift className="h-16 w-16 mx-auto mb-4 text-emerald-200" />
                <p className="text-lg font-medium text-gray-700">No food donations available yet</p>
                <p className="text-sm text-gray-500 mt-2">Be the first to donate and help reduce food waste!</p>
              </div>
            ) : (
              donatedFood.map((item: DonatedFoodType) => (
                <Card key={item.id} className="overflow-hidden rounded-3xl border-emerald-100 bg-white/90 shadow-md hover:shadow-xl transition-shadow">
                  <CardHeader className="p-4 flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={item.avatar || "/placeholder.svg?height=80&width=80"} alt={item.foodName || "Donator"} />
                      <AvatarFallback>{item.foodName ? item.foodName[0].toUpperCase() : "?"}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold flex-1 text-center">{item.foodName}</span>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Image gallery */}
                    {(item.imageUrls && item.imageUrls.length > 0) || item.imageUrl ? (
                      <div className="bg-gray-100">
                        {item.imageUrls && item.imageUrls.length > 1 ? (
                          <div className="grid grid-cols-2 gap-1">
                            {item.imageUrls.slice(0, 4).map((imageUrl, index) => (
                              <div key={index} className="w-full bg-gray-200 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageUrl} alt={`Food ${index + 1}`} className="w-full h-auto max-h-64 object-contain" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="w-full bg-gray-100 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={(item.imageUrls && item.imageUrls[0]) || item.imageUrl || "/placeholder.svg"} alt="Food" className="w-full h-auto max-h-96 object-contain" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image available</span>
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-gray-700 mb-4 leading-relaxed">{item.description}</p>
                      {/* Show phone number above location if available */}
                      {item.userId && donorPhones[item.userId] && (
                        <div className="text-sm text-gray-700 mb-3 bg-emerald-50 p-3 rounded-xl">
                          <span className="font-semibold text-emerald-700">Phone:</span> {donorPhones[item.userId]}
                        </div>
                      )}
                      <p className="text-gray-600 text-sm mb-2"><span className="font-semibold text-emerald-700">Location:</span> {item.location}</p>
                      <p className="text-gray-600 text-sm mb-2"><span className="font-semibold text-emerald-700">Expiry:</span> {item.expiryDate || "N/A"}</p>
                      <p className="text-gray-600 text-sm mb-4"><span className="font-semibold text-emerald-700">Pickup:</span> {item.pickupInstructions || "N/A"}</p>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex justify-center gap-2 flex-wrap">
                          {item.userId !== user?.email && item.userId !== auth.currentUser?.uid && (
                            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                              // Navigate to chat page with donator
                              router.push(`/chat?donorId=${item.userId}&donationId=${item.id}`);
                            }}>
                              <MessageCircle className="h-5 w-5 mr-2" />
                              Contact Donator
                            </Button>
                          )}
                          {item.userId === user?.email || item.userId === auth.currentUser?.uid ? (
                            <Button
                              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
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
                              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this donation?')) {
                                  try {
                                    const authHeader = AuthTokenManager.getAuthHeader();
                                    const csrfHeaders = await getCsrfHeaders();
                                    const res = await fetch(`/api/donated-food?id=${item.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        ...(authHeader || {}),
                                        ...csrfHeaders,
                                      },
                                    });
                                    if (!res.ok) {
                                      const data = await res.json();
                                      throw new Error(data?.error?.message || data.error || 'Failed to delete');
                                    }
                                    setDonatedFood((prev) => prev.filter((f) => f.id !== item.id));
                                  } catch {
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
