"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, MessageCircle, Send, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore"

interface Message {
  id: string
  senderId: string
  receiverId: string
  text: string
  timestamp: Timestamp | null
}

interface ProfileDataType {
  fullName: string
  email: string
  avatar: string
}

interface DonorInfo {
  name: string
  avatar: string
  phone: string
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const donorId = searchParams?.get("donorId") || null
  // donationId can be used later for context about the donation
  const _donationId = searchParams?.get("donationId") || null

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileDataType>({
    fullName: "",
    email: "",
    avatar: ""
  })
  const [donorInfo, setDonorInfo] = useState<DonorInfo>({
    name: "",
    avatar: "",
    phone: ""
  })
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auth guard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        window.location.href = "/login"
        return
      }
      setCurrentUserId(firebaseUser.uid)

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      const fullName = userDoc.exists() ? userDoc.data().name : ""
      const avatar = userDoc.exists() ? userDoc.data().avatar || "" : ""
      const email = firebaseUser.email || ""
      setProfileData({
        fullName: fullName || firebaseUser.displayName || "",
        email: email,
        avatar: avatar
      })
    })
    return () => unsubscribe()
  }, [])

  // Fetch donor info
  useEffect(() => {
    const fetchDonorInfo = async () => {
      if (!donorId) return

      try {
        const res = await fetch(`/api/users/${donorId}`)
        if (res.ok) {
          const donor = await res.json()
          setDonorInfo({
            name: donor.name || "Donator",
            avatar: donor.avatar || "",
            phone: donor.phone || ""
          })
        }
      } catch (error) {
        console.error("Error fetching donor info:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDonorInfo()
  }, [donorId])

  // Listen for messages
  useEffect(() => {
    if (!currentUserId || !donorId) return

    // Create a unique chat room ID (sorted to ensure consistency)
    const chatRoomId = [currentUserId, donorId].sort().join("_")

    const messagesRef = collection(db, "chats", chatRoomId, "messages")
    const q = query(messagesRef, orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = []
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          ...doc.data()
        } as Message)
      })
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [currentUserId, donorId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || !donorId) return

    const chatRoomId = [currentUserId, donorId].sort().join("_")

    try {
      await addDoc(collection(db, "chats", chatRoomId, "messages"), {
        senderId: currentUserId,
        receiverId: donorId,
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  if (loading || !profileData.fullName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500 text-lg">Loading chat...</div>
      </div>
    )
  }

  if (!donorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">No donor selected</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
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
                Edit Profile
              </Link>
              <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link href="/donate-food" className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100">
                <Gift className="h-5 w-5 mr-3" />
                Donate Food
              </Link>
              <Link href="/chat" className="flex items-center p-3 bg-gray-100 text-green-600 rounded-md">
                <MessageCircle className="h-5 w-5 mr-3" />
                Chat
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                try {
                  await auth.signOut()
                  window.location.href = "/login"
                } catch {
                  alert("Failed to sign out. Please try again.")
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
      <div className="flex-1 lg:ml-64 flex flex-col h-screen">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center flex-1">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={donorInfo.avatar || "/placeholder.svg?height=40&width=40"} alt={donorInfo.name} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{donorInfo.name}</h1>
                {donorInfo.phone && (
                  <p className="text-sm text-gray-500">{donorInfo.phone}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-900 shadow"
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.timestamp && (
                      <p className={`text-xs mt-1 ${
                        message.senderId === currentUserId ? "text-green-100" : "text-gray-400"
                      }`}>
                        {message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Message input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
