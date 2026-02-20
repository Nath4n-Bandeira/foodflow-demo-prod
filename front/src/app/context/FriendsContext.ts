import { create } from "zustand"
import { persist } from "zustand/middleware"
import Cookies from "js-cookie"

export interface Friend {
  id: string
  nome: string
  email: string
  avatar?: string
}

export interface FriendRequest {
  id: string
  senderId: string
  senderName: string
  senderEmail: string
  receiverId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
}

type FriendsStore = {
  friends: Friend[]
  messages: Message[]
  activeChat: Friend | null
  friendRequests: FriendRequest[]
  loadFriends: () => Promise<void>  // Add load friends from backend
  sendFriendRequest: (targetUserId: string, targetUserName: string, targetUserEmail: string) => Promise<void>
  acceptFriendRequest: (requestId: string, friend: Friend) => Promise<void>
  rejectFriendRequest: (requestId: string) => Promise<void>
  addFriend: (friend: Friend) => void
  removeFriend: (friendId: string) => void
  sendMessage: (message: Omit<Message, "id" | "timestamp" | "read">) => Promise<void>
  markAsRead: (messageId: string) => void
  getConversation: (userId: string, friendId: string) => Message[]
  loadConversation: (userId: string, friendId: string) => Promise<void>
  setMessages: (messages: Message[]) => void
  openChat: (friend: Friend) => void
  closeChat: () => void
  reset: () => void
}

const getAuthHeaders = () => {
  const token = Cookies.get("token")
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export const useFriendsStore = create<FriendsStore>()(
  persist(
    (set, get) => ({
      friends: [],
      messages: [],
      activeChat: null,
      friendRequests: [],

      loadFriends: async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/amigos`, {
            headers: getAuthHeaders(),
          })

          if (!response.ok) {
            throw new Error("Failed to load friends")
          }

          const friends = await response.json()
          set({ friends })
        } catch (error) {
          console.error("Error loading friends:", error)
        }
      },

      sendFriendRequest: async (targetUserId: string, targetUserName: string, targetUserEmail: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/friendRequests`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              receiverId: targetUserId,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to send friend request")
          }

          const savedRequest = await response.json()

          set((state) => ({
            friendRequests: [
              ...state.friendRequests,
              {
                id: savedRequest.id,
                senderId: savedRequest.senderId,
                senderName: savedRequest.senderName || "Usuário",
                senderEmail: savedRequest.senderEmail || "",
                receiverId: savedRequest.receiverId,
                status: "pending",
                createdAt: new Date(savedRequest.createdAt),
              },
            ],
          }))
        } catch (error) {
          throw error
        }
      },

      acceptFriendRequest: async (requestId: string, friend: Friend) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/friendRequests/${requestId}/accept`, {
            method: "POST",
            headers: getAuthHeaders(),
          })

          if (!response.ok) {
            throw new Error("Failed to accept friend request")
          }

          set((state) => ({
            friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
            friends: [...state.friends, friend],
          }))
        } catch (error) {
          throw error
        }
      },

      rejectFriendRequest: async (requestId: string) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/friendRequests/${requestId}/reject`, {
            method: "POST",
            headers: getAuthHeaders(),
          })

          if (!response.ok) {
            throw new Error("Failed to reject friend request")
          }

          set((state) => ({
            friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
          }))
        } catch (error) {
          throw error
        }
      },

      addFriend: (friend) =>
        set((state) => ({
          friends: [...state.friends, friend],
        })),
      removeFriend: (friendId) =>
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== friendId),
        })),
      sendMessage: async (message) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/mensagens`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              destinatarioId: message.receiverId,
              conteudo: message.content,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to send message")
          }

          const savedMessage = await response.json()

          set((state) => ({
            messages: [
              ...state.messages,
              {
                id: savedMessage.id,
                senderId: savedMessage.remetenteId,
                receiverId: savedMessage.destinatarioId,
                content: savedMessage.conteudo,
                timestamp: new Date(savedMessage.createdAt),
                read: savedMessage.lida,
              },
            ],
          }))
        } catch (error) {
          set((state) => ({
            messages: [
              ...state.messages,
              {
                ...message,
                id: Date.now().toString(),
                timestamp: new Date(),
                read: false,
              },
            ],
          }))
        }
      },
      markAsRead: (messageId) =>
        set((state) => ({
          messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)),
        })),
      getConversation: (userId, friendId) => {
        const { messages } = get()
        return messages
          .filter(
            (msg) =>
              (msg.senderId === userId && msg.receiverId === friendId) ||
              (msg.senderId === friendId && msg.receiverId === userId),
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      },
      loadConversation: async (userId, friendId) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/mensagens/conversa/${friendId}`, {
            headers: getAuthHeaders(),
          })

          if (!response.ok) {
            throw new Error(`Failed to load messages: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          const messages: Message[] = Array.isArray(data)
            ? data.map((msg: any) => ({
                id: msg.id,
                senderId: msg.remetenteId,
                receiverId: msg.destinatarioId,
                content: msg.conteudo,
                timestamp: new Date(msg.createdAt),
                read: msg.lida,
              }))
            : []

          set((state) => {
            const otherMessages = state.messages.filter(
              (m) =>
                !(
                  (m.senderId === userId && m.receiverId === friendId) ||
                  (m.senderId === friendId && m.receiverId === userId)
                ),
            )
            return {
              messages: [...otherMessages, ...messages],
            }
          })
        } catch (error) {
          // Silent error handling
        }
      },
      setMessages: (messages) => set({ messages }),
      openChat: (friend) => set({ activeChat: friend }),
      closeChat: () => set({ activeChat: null }),
      reset: () => set({ friends: [], messages: [], activeChat: null, friendRequests: [] }),
    }),
    {
      name: "friends-storage",
      partialize: (state) => ({
        friends: state.friends,
        messages: state.messages,
        friendRequests: state.friendRequests,
      }),
    },
  ),
)
