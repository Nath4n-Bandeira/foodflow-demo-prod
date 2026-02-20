const API_URL = process.env.NEXT_PUBLIC_URL_API || "http://localhost:3001"

interface ConversationMessage {
  role: "user" | "assistant"
  content: string
}

export async function chatWithPantryAssistant(
  userMessage: string,
  dispensaId: number,
  conversationHistory?: ConversationMessage[],
) {
  try {
    const response = await fetch(`${API_URL}/geminiPantry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: userMessage,
        dispensaId: dispensaId,
        conversationHistory: conversationHistory || [],
      }),
    })

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json()
        console.error("Erro 400 no backend:", errorData.erro)
      }
      throw new Error("Erro ao chamar backend Gemini Pantry")
    }

    const data = await response.json()
    return data.response
  } catch (error) {
    console.error("Erro no chatWithPantryAssistant:", error)
    throw new Error("Erro ao gerar resposta do assistente de dispensa")
  }
}
