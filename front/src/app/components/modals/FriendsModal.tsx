"use client"
import { useState } from "react"
import { X, Users, MessageCircle, User } from "lucide-react"
import { useFriendsStore, type Friend } from "@/src/app/context/FriendsContext"

export default function FriendsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { friends, openChat } = useFriendsStore()

  const handleOpenChat = (friend: Friend) => {
    openChat(friend)
    setIsOpen(false)
  }

  return (
    <>
     
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium relative"
      >
        <Users className="w-5 h-5" />
        <span className="hidden sm:inline">Amigos</span>
        {friends.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {friends.length}
          </span>
        )}
      </button>

    
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Seus Amigos</h2>
                  <p className="text-sm text-gray-500">{friends.length} amigo(s)</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

          
            <div className="flex-1 overflow-y-auto p-6">
              {friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-white select-none">
                            {friend.nome?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-base font-bold text-gray-900 truncate">{friend.nome || "Usuário"}</h3>
                          <p className="text-sm text-gray-500 truncate">{friend.email}</p>
                        </div>
                        <button
                          onClick={() => handleOpenChat(friend)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors flex-shrink-0"
                          title="Enviar mensagem"
                        >
                          <MessageCircle className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum amigo ainda</h3>
                  <p className="text-sm text-gray-500 mb-4">Adicione amigos para começar a conversar!</p>
                  <a
                    href="/amigos"
                    onClick={() => setIsOpen(false)}
                    className="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Adicionar Amigos
                  </a>
                </div>
              )}
            </div>

           
            {friends.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <a
                  href="/amigos"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ver Todos os Amigos
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
