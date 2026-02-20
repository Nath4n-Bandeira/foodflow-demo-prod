"use client"
import { useState, useEffect } from "react"
import { useClienteStore } from "../context/ClienteContext"
import ClientModal from "../components/modals/clientModal"
import type { DispensaItf } from "../utils/types/DispensaItf"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useFriendsStore } from "../context/FriendsContext"
import { Users, UserCheck } from "lucide-react"

export default function Perfil() {
  const { cliente } = useClienteStore()
  const { friends, loadFriends } = useFriendsStore()
  const [dispensasCriadas, setDispensasCriadas] = useState<DispensaItf[]>([])
  const [dispensasMembro, setDispensasMembro] = useState<DispensaItf[]>([])
  const id = cliente.id
  const router = useRouter()

  const getInitial = (name: string | undefined): string => {
    return name?.charAt(0).toUpperCase() || "U"
  }

  const [logado, setLogado] = useState<boolean>(false)

  useEffect(() => {
    if (Cookies.get("token")) {
      setLogado(true)
    } else {
      router.replace("/")
    }
  }, [])

  useEffect(() => {
    const carregarDispensas = async () => {
      try {
        const criadasRes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensa/cliente/${id}`)
        const criadas = await criadasRes.json()

        const membroRes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/dispensa/membro/${id}`)
        const membro = await membroRes.json()

        const membroFiltrado = membro.filter((d: DispensaItf) => !criadas.find((c: DispensaItf) => c.id === d.id))

        setDispensasCriadas(criadas)
        setDispensasMembro(membroFiltrado)
      } catch (error) {
        console.error("Erro ao carregar dispensas:", error)
      }
    }

    if (id) {
      carregarDispensas()
      loadFriends()
    }
  }, [id, loadFriends])

  const renderDispensas = (lista: DispensaItf[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
      {lista.map((dispensa) => (
        <div
          key={dispensa.id}
          className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
        >
          <div className="flex-grow">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{dispensa.nome}</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              {dispensa.createdAt
                ? new Date(dispensa.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Sem data"}
            </p>
          </div>
          <a
            href={`/dispensa/${dispensa.id}`}
            className="mt-4 sm:mt-6 inline-block text-green-600 font-semibold hover:underline self-start text-sm sm:text-base"
          >
            Ver detalhes →
          </a>
        </div>
      ))}
    </div>
  )

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 items-center">
            <div className="md:col-span-1 flex justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-5xl sm:text-6xl font-bold text-white select-none">
                  {getInitial(cliente?.nome)}
                </span>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4 sm:space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600 text-sm sm:text-base">Bem-vindo(a)</h3>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  {cliente?.nome || "Nome do Usuário"}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            Meus Amigos
          </h2>
          <span className="text-sm text-gray-500">{friends.length} amigo(s)</span>
        </div>

        {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3 sm:gap-4"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg sm:text-xl font-bold text-white select-none">
                    {friend.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{friend.nome}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{friend.email}</p>
                </div>
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-2xl border border-slate-200">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <p className="text-slate-500 text-sm sm:text-base">Você ainda não tem amigos adicionados.</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Vá para a página de amigos para adicionar novos amigos!
            </p>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Dispensas Criadas por Você</h2>
          <div>
            <ClientModal usuarioID={id} />
          </div>
        </div>

        {dispensasCriadas.length > 0 ? (
          renderDispensas(dispensasCriadas)
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm sm:text-base">Você ainda não criou nenhuma dispensa.</p>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-4 md:py-8 pb-12 sm:pb-16">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Dispensas que Você Participa</h2>
        {dispensasMembro.length > 0 ? (
          renderDispensas(dispensasMembro)
        ) : (
          <div className="text-center py-8 sm:py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm sm:text-base">Você ainda não participa de nenhuma outra dispensa.</p>
          </div>
        )}
      </section>
    </main>
  )
}
