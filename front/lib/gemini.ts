import { GoogleGenerativeAI } from "@google/generative-ai"
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "")

const API_URL = process.env.NEXT_PUBLIC_URL_API || "http://localhost:3001"

export async function chatWithGemini(userMessage: string, selectedItems: any[]) {
  try {
   const response = await fetch(`${API_URL}/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: userMessage, 
      }),
    })

    if (!response.ok) {
        // log de erro caso de b.0
        if (response.status === 400) {
            const errorData = await response.json();
            console.error("Erro 400 no backend:", errorData.erro);
        }
      throw new Error("Erro ao chamar backend Gemini")
    }

    const data = await response.json()
    
    return data.resposta 
  } catch (error) {
    console.error("Erro no chatWithGemini:", error)
    throw new Error("Erro ao gerar resposta do chatbot")
  }
}
