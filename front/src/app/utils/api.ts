export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_URL_API || "http://localhost:3001"
).replace(/\/+$/, "")

export function apiUrl(path: string) {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`
}
