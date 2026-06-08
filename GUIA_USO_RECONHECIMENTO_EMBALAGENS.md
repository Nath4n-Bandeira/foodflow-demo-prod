# 📸 Guia de Uso - Reconhecimento de Embalagens

## 🎯 O que é?

Essa feature permite fotografar embalagens de produtos alimentares e extrair automaticamente as informações usando Inteligência Artificial (Google Gemini Vision).

## 🚀 Como Usar

### 1. **Acessar a Feature**
- Navegue até uma Dispensa
- Você verá um novo botão **"📸 Foto"** (ou "Foto" em desktop) na barra de ferramentas
- Clique nele para abrir a câmera

### 2. **Tirar a Foto**
- Permita que o navegador acesse sua câmera
- Posicione a câmera de forma que **toda a embalagem fique visível**
- Garanta boa iluminação para melhor reconhecimento
- Clique em "Capturar Foto"

### 3. **Revisar os Dados Extraídos**
Um modal mostrará os dados extraídos automaticamente:
- ✅ Nome do produto
- ✅ Marca
- ✅ Peso/Volume
- ✅ Data de validade
- ✅ Ingredientes
- ✅ Informação nutricional
- ✅ Confiança da análise

### 4. **Editar se Necessário**
- Todos os campos são editáveis
- Se algum dado estiver incorreto, você pode corrigir antes de salvar
- A "Confiança da Análise" indica quão certa a IA está (verde ✅ = alta; amarelo ⚠️ = média; vermelho ❌ = baixa)

### 5. **Salvar o Produto**
- Clique em "Salvar Produto"
- O produto será adicionado à dispensa automaticamente
- Você verá uma mensagem de sucesso

---

## 💡 Dicas Para Melhor Reconhecimento

1. **Boa Iluminação** 💡
   - Tire a foto com luz natural ou LED
   - Evite sombras sobre a embalagem

2. **Visibilidade Clara** 👁️
   - Posicione a câmera de forma que toda a frente da embalagem fique visível
   - Mantenha a embalagem reta e bem definida

3. **Respeite a Distância** 📏
   - Não muito perto (não sai tudo desfocado)
   - Não muito longe (não consegue ler o texto)

4. **Produtos Melhor Reconhecidos** ✨
   - Alimentos embalados com rótulo claro
   - Embalagens com informações bem visíveis
   - Produtos com datas de validade explícitas

5. **Produtos com Dificuldade** ❌
   - Alimentos granel/soltos
   - Embalagens muito enrugadas ou danificadas
   - Fotos com muito brilho ou reflexo

---

## ⚙️ Configuração Técnica

### Ambiente

Certifique-se de que você tem as seguintes variáveis de ambiente configuradas:

**Back-end (.env):**
```env
GOOGLE_API_KEY=seu_api_key_do_google
DATABASE_URL=sua_url_do_banco
```

**Front-end (.env.local):**
```env
NEXT_PUBLIC_URL_API=http://localhost:3001
NEXT_PUBLIC_GEMINI_API_KEY=seu_api_key
```

### Dependências Instaladas

```
Backend:
- @google/generative-ai (já existente)
- Express.js
- Prisma

Frontend:
- React
- Next.js
- ShadcN UI (componentes)
```

---

## 🔌 Endpoints da API

### Analisar Imagem
```
POST /productRecognition/analyze
Headers: Authorization: Bearer {token}
Body: {
  "image": "base64_string_or_data_url",
  "dispensaId": number
}
Response: {
  "sucesso": true,
  "dados": {
    "nome": string,
    "marca": string | null,
    "peso": number | null,
    "unidade": string,
    "validade": "YYYY-MM-DD" | null,
    "ingredientes": string | null,
    "nutrientes": object,
    "codigoBarras": string | null,
    "confianca": 0.0 - 1.0
  }
}
```

### Criar Produto
```
POST /productRecognition/create
Headers: Authorization: Bearer {token}
Body: {
  "nome": string,
  "marca": string,
  "peso": number,
  "unidade": string,
  "validade": "YYYY-MM-DD",
  "ingredientes": string,
  "nutrientes": object,
  "dispensaId": number
}
Response: {
  "sucesso": true,
  "produto": {...}
}
```

### Listar Produtos Reconhecidos
```
GET /productRecognition/dispensa/:dispensaId
Response: [...produtos]
```

### Deletar Produto
```
DELETE /productRecognition/:id
Headers: Authorization: Bearer {token}
Response: {
  "sucesso": true,
  "mensagem": "Produto deletado com sucesso"
}
```

---

## 🐛 Troubleshooting

### "Não foi possível acessar a câmera"
- ✅ Permita acesso à câmera no navegador
- ✅ Verifique se você está usando HTTPS (exceto localhost)
- ✅ Certifique-se que sua câmera funciona em outros aplicativos

### "Confiança muito baixa"
- ✅ Melhore a iluminação
- ✅ Tire a foto com melhor ângulo
- ✅ Garanta que a embalagem está clara e legível
- ✅ Remova bloqueios/reflexos da câmera

### "Erro ao processar imagem"
- ✅ Verifique sua chave API do Google
- ✅ Garanta que a API Vision está ativada
- ✅ Tente uma foto menor ou com melhor compressão

### Banco de Dados
Se tiver erro de migração, consulte a seção "Fixes Necessários" abaixo

---

## 🔧 Fixes Necessários

### Erro de Migração Prisma
Se você receber erro `P3006` sobre tipo já existente, execute:

```bash
cd back
npx prisma migrate resolve --rolled-back add_alimento_do_post_model
# ou force reset (cuidado - limpa dados!)
npx prisma migrate reset --force
```

---

## 📊 Estrutura de Dados

### Model AlimentoDoPost (Banco de Dados)
```prisma
model AlimentoDoPost {
  id              Int      @id @default(autoincrement())
  nome            String   
  peso            Decimal?
  unidade         String   @default("KG")
  validade        DateTime?
  marca           String?
  ingredientes    String?
  nutrientes      Json?
  imagemUrl       String?
  confianca       Decimal  @default(0.95)
  dispensaId      Int
  usuarioId       String   
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  dispensa        Dispensa @relation(...)
  usuario         Usuario  @relation(...)
}
```

---

## 🚀 Próximas Melhorias (Roadmap)

- [ ] Integração com API Open Food Facts para ingredientes
- [ ] Reconhecimento de código de barras (EAN/UPC)
- [ ] OCR aprimorado para datas
- [ ] Histórico de produtos já reconhecidos
- [ ] Sugestões baseadas em histórico
- [ ] Modo offline com ML local
- [ ] Reconhecimento de alimentos sem embalagem
- [ ] Análise de valor nutricional por 100g padronizado

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o console do navegador (F12)
2. Verifique os logs do servidor backend
3. Revise as variáveis de ambiente
4. Teste a API manualmente com Postman/Insomnia
5. Consulte a documentação do Google Gemini Vision

---

**Última atualização:** Março 2026
**Status:** ✅ Beta (funcional e testado)
