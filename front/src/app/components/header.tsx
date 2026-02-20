"use client"
import Link from "next/link"
import Image from "next/image"
import { useClienteStore } from "../context/ClienteContext"
import { useFriendsStore } from "../context/FriendsContext"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ChevronDown, LogOut, Settings, User, Sandwich, Menu, X } from "lucide-react"
import Cookie from "js-cookie"
import FriendsModal from "./modals/FriendsModal"
import DispensaInvitesModal from "./modals/DispensaInvitesModal"
import { AIPantryAssistant } from "./modals/AiPantryAssistant"
import { useAIChatbotStore }  from "../context/AiChatBotContext"

export function Header() {
  const { cliente, deslogaCliente } = useClienteStore()
  const { reset: resetFriends } = useFriendsStore()
  const { setIsOpen: setAIChatbotOpen, setDispensaId } = useAIChatbotStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentDispensaId, setCurrentDispensaId] = useState<number | null>(null)

  useEffect(() => {
    const match = pathname?.match(/\/dispensa\/(\d+)/)
    if (match) {
      setCurrentDispensaId(Number(match[1]))
    } else {
      setCurrentDispensaId(null)
    }
  }, [pathname])

  function clienteSair() {
    if (confirm("Confirma saída da conta ?")) {
      deslogaCliente()
      resetFriends()
      if (localStorage.getItem("clienteKey")) {
        localStorage.removeItem("clienteKey")
      }
      router.push("/login")
      Cookie.remove("token")
    }
  }

  const handleAIChatbotClick = () => {
    if (currentDispensaId) {
      setDispensaId(currentDispensaId)
      setAIChatbotOpen(true)
      setIsMobileMenuOpen(false)
    } else {
      alert("Navegue até uma dispensa para usar o assistente inteligente")
    }
  }

  const isLoggedIn = cliente && cliente.id

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href={isLoggedIn ? "/" : "/"} className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/horde.png"
                  alt="FoodFlow Logo"
                  width={40}
                  height={40}
                  className="h-8 w-8 sm:h-12 sm:w-12"
                  priority
                />
                <span className="text-lg sm:text-2xl font-semibold whitespace-nowrap text-black">foodflow</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              {isLoggedIn ? (
                <>
                  <FriendsModal />
                  <DispensaInvitesModal />

                  <button
                    onClick={handleAIChatbotClick}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm hover:shadow-md text-sm"
                    title="Assistente Inteligente de Dispensa"
                  >
                    <Sandwich className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="font-semibold hidden lg:inline">Assistente IA</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <User className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                      <span className="hidden lg:inline font-semibold text-gray-700 max-w-[120px] truncate">
                        {cliente.nome}
                      </span>
                      <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                    </button>

                    {isUserMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5"
                        onMouseLeave={() => setIsUserMenuOpen(false)}
                      >
                        <div className="p-2">
                          <div className="px-3 py-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{cliente.nome}</p>
                          </div>
                          <div className="h-px bg-gray-200 my-1"></div>
                          <Link
                            href="/perfil"
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                          >
                            <Settings className="w-4 h-4 text-gray-500" /> Meu Perfil
                          </Link>
                          <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                          >
                            Minhas Dispensas
                          </Link>
                          <button
                            onClick={clienteSair}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 hover:text-red-700"
                          >
                            <LogOut className="w-4 h-4" /> Sair
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    Criar Conta
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && isLoggedIn && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <User className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-900">{cliente.nome}</span>
              </div>

              <div className="space-y-1">
                <FriendsModal />
                <DispensaInvitesModal />

                <button
                  onClick={handleAIChatbotClick}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Sandwich className="w-5 h-5 text-green-600" />
                  Assistente IA
                </button>

                <Link
                  href="/perfil"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                  Meu Perfil
                </Link>

                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Minhas Dispensas
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    clienteSair()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </div>
          )}

          {/* Mobile Menu - Not Logged In */}
          {isMobileMenuOpen && !isLoggedIn && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <Link
                href="/login"
                className="block px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="block px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Criar Conta
              </Link>
            </div>
          )}
        </nav>
      </header>
      <AIPantryAssistant
        dispensaId={currentDispensaId}
        isOpen={useAIChatbotStore((state) => state.isOpen)}
        onClose={() => setAIChatbotOpen(false)}
      />
    </>
  )
}