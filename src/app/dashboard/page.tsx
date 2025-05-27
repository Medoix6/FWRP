"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Home, MessageCircle, User, LogOut, Menu, Gift, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import CloudinaryAvatar from "@/components/ui/CloudinaryAvatar"

// This would typically come from an API or database
const feedItems = [
  {
    id: 1,
    username: "healthyeats",
    avatarSrc: "/placeholder.svg?height=40&width=40",
    imageSrc: "/placeholder.svg?height=400&width=400",
    description: "Fresh vegetables from my garden. Available for pickup!",
  },
  {
    id: 2,
    username: "bakerlove",
    avatarSrc: "/placeholder.svg?height=40&width=40",
    imageSrc: "/placeholder.svg?height=400&width=400",
    description: "Excess bread from today's bake. First come, first served!",
  },
  {
    id: 3,
    username: "fruitfanatic",
    avatarSrc: "/placeholder.svg?height=40&width=40",
    imageSrc: "/placeholder.svg?height=400&width=400",
    description: "Ripe bananas perfect for smoothies or baking. Free to a good home!",
  },
]

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ displayName: string | null, email: string | null, fullName?: string | null, avatar?: string | null }>({ displayName: null, email: null, avatar: null })
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    avatar: ""
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let displayName = firebaseUser.displayName
          ? firebaseUser.displayName
          : firebaseUser.email
            ? firebaseUser.email.split("@")[0]
            : "No Username"
        let email = firebaseUser.email || "No Email"
        let fullName = null
        let avatar = ""
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          fullName = data.name || null
          avatar = data.avatar || ""
        }
        setUser({ displayName, email, fullName, avatar })
        setProfileData({
          fullName: fullName || displayName,
          email: email,
          avatar: avatar
        })
      }
    })
    return () => unsubscribe()
  }, [])

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
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/login">
                <LogOut className="h-5 w-5 mr-3" />
                Sign out
              </Link>
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
            {feedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="p-4 flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={item.avatarSrc || "/placeholder.svg"} alt={item.username} />
                    <AvatarFallback>{item.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">{item.username}</span>
                </CardHeader>
                <CardContent className="p-0">
                  <img src={item.imageSrc || "/placeholder.svg"} alt="Food" className="w-full h-auto" />
                  <div className="p-4">
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex justify-center">
                      <Button className="w-full sm:w-auto">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Contact Donator
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
