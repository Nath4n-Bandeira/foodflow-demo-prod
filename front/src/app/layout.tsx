import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "./components/header"
import { footerzinho } from "./components/footer"
import { GlobalChatManager } from "./components/GlobalChatManager"
import { Toaster } from "./components/ui/sonner"
import { ChatbotIcon } from "./components/ChatBotIcon"
import { ChatbotModal } from "./components/ChatBotModal"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Foodflow",
  description: "Seu gerenciador de alimentos e analise",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        {children}
        {footerzinho()}
         <ChatbotIcon />
        <ChatbotModal />
        <GlobalChatManager />
       
        <Toaster />
      </body>
    </html>
  )
}
