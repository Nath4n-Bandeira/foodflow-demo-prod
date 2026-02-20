"use client"
import { ChatBox } from "./ChatBox"
import { useFriendsStore } from "../context/FriendsContext"

export function GlobalChatManager() {
  const { activeChat, closeChat } = useFriendsStore()

  if (!activeChat) return null

  return <ChatBox friend={activeChat} onClose={closeChat} />
}
