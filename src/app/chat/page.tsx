"use client"

export const dynamic = 'force-dynamic';

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Gift, User, LogOut, Menu, MessageCircle, Send, ArrowLeft, Settings, Check, CheckCheck } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/app/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, getDocs, limit, where, writeBatch } from "firebase/firestore"
import { AuthTokenManager } from "@/lib/clientAuth"
import { LoadingScreen, LoadingSpinner } from "@/components/Loading"
import { logout } from "@/lib/logout"

interface Message {
  id: string
  senderId: string
  receiverId: string
  text: string
  timestamp: Timestamp | null
  status: "sent" | "delivered" | "read"
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

interface Conversation {
  odId: string
  odUserId: string
  lastMessage: string
  lastTimestamp: Timestamp | null
  otherUserName: string
  otherUserAvatar: string
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const donorId = searchParams?.get("donorId") || null
  // donationId can be used later for context about the donation
  // const donationId = searchParams?.get("donationId") || null

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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
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

  // Listen for unread messages
  useEffect(() => {
    if (!profileData.email) return;

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
  }, [profileData.email]);

  // Fetch donor info
  useEffect(() => {
    const fetchDonorInfo = async () => {
      if (!donorId) {
        setLoading(false)
        return
      }

      try {
        const authHeader = AuthTokenManager.getAuthHeader()
        const res = await fetch(`/api/users/${donorId}`, {
          headers: {
            ...(authHeader || {}),
          },
        })
        if (res.ok) {
          const donorResponse = await res.json()
          const donor = donorResponse.data || donorResponse
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

  // Fetch all conversations for the current user with real-time updates
  useEffect(() => {
    if (!currentUserId) return

    const chatsRef = collection(db, "chats")
    const chatsQuery = query(chatsRef, where("participants", "array-contains", currentUserId))

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      try {
        const userConversations: Conversation[] = []
        
        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data()
          const chatRoomId = chatDoc.id
          
          // Check if current user is part of this chat using participants array or chatroomID 
          const isParticipant = chatData.participants 
            ? chatData.participants.includes(currentUserId)
            : chatRoomId.includes(currentUserId)
          
          if (isParticipant) {
            // Get other user ID
            let otherUserId: string | undefined
            if (chatData.participants) {
              otherUserId = chatData.participants.find((id: string) => id !== currentUserId)
            } else {
              const userIds = chatRoomId.split("_")
              otherUserId = userIds.find(id => id !== currentUserId)
            }
            
            if (otherUserId) {
              // Get the last message from chat document or fetch from messages
              let lastMessage = chatData.lastMessage || ""
              let lastTimestamp: Timestamp | null = chatData.lastTimestamp || null
              
              // If no lastMessage in chat doc, fetch from messages subcollection
              if (!lastMessage) {
                const messagesRef = collection(db, "chats", chatRoomId, "messages")
                const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1))
                const messagesSnapshot = await getDocs(messagesQuery)
                
                if (!messagesSnapshot.empty) {
                  const lastMsgData = messagesSnapshot.docs[0].data()
                  lastMessage = lastMsgData.text || ""
                  lastTimestamp = lastMsgData.timestamp || null
                }
              }
              
              // Get other user's info
              try {
                const authHeader = AuthTokenManager.getAuthHeader()
                const res = await fetch(`/api/users/${otherUserId}`, {
                  headers: {
                    ...(authHeader || {}),
                  },
                })
                if (res.ok) {
                  const otherUserResponse = await res.json()
                  const otherUser = otherUserResponse.data || otherUserResponse
                  userConversations.push({
                    odId: chatRoomId,
                    odUserId: otherUserId,
                    lastMessage,
                    lastTimestamp,
                    otherUserName: otherUser.name || "User",
                    otherUserAvatar: otherUser.avatar || ""
                  })
                }
              } catch (error) {
                console.error("Error fetching user info:", error)
              }
            }
          }
        }
        
        // Sort by last message timestamp
        userConversations.sort((a, b) => {
          if (!a.lastTimestamp) return 1
          if (!b.lastTimestamp) return -1
          return b.lastTimestamp.toMillis() - a.lastTimestamp.toMillis()
        })
        
        setConversations(userConversations)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoadingConversations(false)
      }
    })

    return () => unsubscribe()
  }, [currentUserId])

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
        const data = doc.data()
        newMessages.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          text: data.text,
          timestamp: data.timestamp,
          status: data.status || "sent"
        } as Message)
      })
      setMessages(newMessages)
    })
    return () => unsubscribe()
  }, [currentUserId, donorId])

  // Mark messages as read when chat is opened and when new messages arrive
  useEffect(() => {
    if (!currentUserId || !donorId || messages.length === 0) return

    const markMessagesAsRead = async () => {
      const chatRoomId = [currentUserId, donorId].sort().join("_")
      const batch = writeBatch(db)
      let hasUpdates = false
 
      // Find messages sent by the other user that are not yet read
      for (const message of messages) {
        if (message.senderId === donorId && message.status !== "read") {
          const messageRef = doc(db, "chats", chatRoomId, "messages", message.id)
          batch.update(messageRef, { status: "read" })
          hasUpdates = true
        }
      }

      if (hasUpdates) {
        try {
          await batch.commit()
        } catch (error) {
          console.error("Error marking messages as read:", error)
        }
      }
    }

    markMessagesAsRead()
  }, [currentUserId, donorId, messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault() 
    if (!newMessage.trim() || !currentUserId || !donorId) return

    const chatRoomId = [currentUserId, donorId].sort().join("_")

    try {
      // Create or update the chat room document with participants
      await setDoc(doc(db, "chats", chatRoomId), {
        participants: [currentUserId, donorId].sort(),
        lastMessage: newMessage.trim(),
        lastTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })

      // Add the message to the messages subcollection with status
      await addDoc(collection(db, "chats", chatRoomId, "messages"), {
        senderId: currentUserId,
        receiverId: donorId,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        status: "sent"
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message. Please try again.")
    }
  }

  if (loading || !profileData.fullName) {
    return <LoadingScreen message="Loading Chat..." />
  }

  if (!donorId) {
    // Show chat list for all the users.
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-lime-50 to-white flex">
        {/* Mobile sidebar toggle Fix*/}
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
                <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                  <Home className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
                <Link href="/donate-food" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                  <Gift className="h-5 w-5 mr-3" />
                  Donate Food
                </Link>
                <Link href="/chat" className="flex items-center p-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
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

        {/* Main content - Conversation List */}
        <div className="flex-1 lg:ml-64 flex flex-col h-screen">
          <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
              <Link href="/dashboard" className="mr-4">
                <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-700">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 bg-transparent">
            <div className="max-w-3xl mx-auto">
              {loadingConversations ? (
                <div className="text-center py-10">
                  <div className="flex items-center justify-center gap-3">
                    <LoadingSpinner />
                    <span className="text-gray-600">Loading conversations...</span>
                  </div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">No conversations yet</p>
                  <p className="text-sm">Start a chat by clicking &quot;Contact Donor&quot; on a food donation!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <Link
                      key={conv.odId}
                      href={`/chat?donorId=${conv.odUserId}`}
                      className="flex items-center p-4 bg-white/90 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                    >
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={conv.otherUserAvatar || "/placeholder.svg?height=48&width=48"} alt={conv.otherUserName} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{conv.otherUserName}</h3>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage || "No messages yet"}</p>
                      </div>
                      {conv.lastTimestamp && (
                        <span className="text-xs text-gray-400">
                          {conv.lastTimestamp.toDate().toLocaleDateString()}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
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
              <Link href="/dashboard" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
              <Link href="/donate-food" className="flex items-center p-3 text-gray-700 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                <Gift className="h-5 w-5 mr-3" />
                Donate Food
              </Link>
              <Link href="/chat" className="flex items-center p-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
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
      <div className="flex-1 lg:ml-64 flex flex-col h-screen">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
            <Link href="/dashboard" className="mr-4">
              <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-700">
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
        <main className="flex-1 overflow-y-auto p-4 bg-transparent">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-10 bg-white/80 rounded-3xl border border-emerald-100 shadow-sm">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      message.senderId === currentUserId
                        ? "bg-emerald-600 text-white"
                        : "bg-white/90 text-gray-900 border border-emerald-100"
                    }`}
                  >
                    <p>{message.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      message.senderId === currentUserId ? "text-emerald-100" : "text-gray-400"
                    }`}>
                      {message.timestamp && (
                        <span className="text-xs">
                          {message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {/* Show status only for sent messages */}
                      {message.senderId === currentUserId && (
                        <span className="ml-1">
                          {message.status === "read" ? (
                            <CheckCheck className="h-4 w-4 text-blue-300" />
                          ) : message.status === "delivered" ? (
                            <CheckCheck className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Message input */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-emerald-100 p-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border-emerald-200 focus:ring-emerald-500"
            />
            <Button type="submit" disabled={!newMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700">
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
