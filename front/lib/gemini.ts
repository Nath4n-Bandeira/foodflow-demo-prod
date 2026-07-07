const API_URL = process.env.NEXT_PUBLIC_URL_API || "http://localhost:3001"

export async function chatWithGemini(userMessage: string, selectedItems: any[]) {
  try {
    const response = await fetch(`${API_URL}/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage,
        selectedItems,
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      console.error("Erro no backend Gemini:", data?.erro || response.statusText)
      throw new Error(data?.erro || "Erro ao chamar backend Gemini")
    }

    return data.resposta
  } catch (error) {
    console.error("Erro no chatWithGemini:", error)
    throw new Error("Erro ao gerar resposta do chatbot")
  }
}
