import { db } from "@/app/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { sanitizeText } from "@/utils/sanitize";

export const chatsService = {
  async getChatRoom(chatRoomId: string) {
    const snap = await getDoc(doc(db, "chats", chatRoomId));
    return snap.exists() ? snap.data() : null;
  },

  async createChatRoom(chatRoomId: string, participants: string[]) {
    await setDoc(doc(db, "chats", chatRoomId), {
      participants,
      updatedAt: serverTimestamp(),
      lastMessage: "No messages yet",
    });
  },

  async sendMessage(chatRoomId: string, senderId: string, receiverId: string, text: string) {
    const sanitizedText = sanitizeText(text);
    if (!sanitizedText) return;

    // Add message
    const msgRef = await addDoc(collection(db, "chats", chatRoomId, "messages"), {
      senderId,
      receiverId,
      text: sanitizedText,
      createdAt: serverTimestamp(),
      status: "sent",
    });

    // Update chat room lastMessage details
    await setDoc(
      doc(db, "chats", chatRoomId),
      {
        lastMessage: sanitizedText,
        lastMessageSenderId: senderId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also write to a flat top-level messages collection for unread counts
    await addDoc(collection(db, "messages"), {
      chatRoomId,
      senderId,
      receiverId,
      text: sanitizedText,
      createdAt: serverTimestamp(),
      status: "sent",
    });

    return msgRef.id;
  },

  subscribeMessages(chatRoomId: string, callback: (messages: any[]) => void, onError?: (err: Error) => void) {
    const q = query(
      collection(db, "chats", chatRoomId, "messages"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(messages);
      },
      onError
    );
  },

  subscribeChats(userId: string, callback: (chats: any[]) => void, onError?: (err: Error) => void) {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const chats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(chats);
      },
      onError
    );
  },

  async markMessagesAsRead(chatRoomId: string, receiverId: string) {
    // Query unread messages in the chat room
    const q = query(
      collection(db, "chats", chatRoomId, "messages"),
      where("receiverId", "==", receiverId),
      where("status", "in", ["sent", "delivered"])
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "read" });
    });

    // Query flat top-level messages for receiver to clear unread badge
    const flatQ = query(
      collection(db, "messages"),
      where("chatRoomId", "==", chatRoomId),
      where("receiverId", "==", receiverId),
      where("status", "in", ["sent", "delivered"])
    );
    const flatSnap = await getDocs(flatQ);
    flatSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "read" });
    });

    await batch.commit();
  }
};
