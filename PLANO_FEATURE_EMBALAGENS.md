# 📦 Plano de Implementação - Reconhecimento de Embalagens de Produtos

## 🎯 Objetivo
Implementar uma feature que permite aos usuários fotografar embalagens de produtos alimentares, extrair informações automaticamente usando Visão Computacional + IA, e criar posts com esses dados no sistema.

---

## 🏗️ Arquitetura da Solução

### **1. TECNOLOGIAS ESCOLHIDAS**

#### Backend:
- **Google Generative AI (Gemini Vision)**: Para análise de imagens e extração de dados
  - Já integrado no projeto
  - Suporta análise de imagens base64
  - Pode extrair texto, datas, nutrientes, ingredientes
  
- **Multer**: Para upload de imagens (já existe)
- **Sharp** (opcional): Para otimização de imagens

#### Frontend:
- **next-camera**: Para captura de câmera em Next.js
- **html5-qrcode**: Alternativa com mais features
- **Canvas API**: Para capturar e processar imagens

#### Datasets Recomendados (para treinar futuramente):
- **Open Food Facts API**: https://world.openfoodfacts.org/
  - 800k+ produtos alimentares
  - Dados estruturados de nutrição
  - API pública gratuita
  
- **USDA FoodData Central**: Nutrição detalhada
- **Google Dataset Search**: Datasets de produtos com embalagens

---

## 📋 ESTRUTURA DE DADOS

### Nova Model Prisma (alimentoDoPost):
```prisma
model AlimentoDoPost {
  id          Int      @id @default(autoincrement())
  nome        String
  peso        Decimal
  validade    DateTime?
  marca       String?
  ingredientes String?
  nutrientes  Json?
  imagemUrl   String?
  dispensaId  Int
  usuarioId   String
  createdAt   DateTime @default(now())
  
  dispensa    Dispensa @relation(fields: [dispensaId], references: [id])
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
}
```

---

## 🔧 IMPLEMENTAÇÃO STEP-BY-STEP

### **BACKEND**

#### 1. Criar rota de upload de imagem: `/routes/productRecognition.ts`
- Recebe imagem base64 ou multipart
- Valida o arquivo
- Converte para base64 se necessário
- Retorna dados estruturados

#### 2. Integração com Gemini Vision
- Enviar imagem para Gemini
- Extrair:
  - Nome do produto
  - Marca
  - Peso/volume
  - Data de validade
  - Ingredientes
  - Informação nutricional
  - Código de barras (EAN/UPC)

#### 3. Criar endpoint POST `/productRecognition/analyze`
```
POST /productRecognition/analyze
- Body: { image: base64String, dispensaId: number }
- Response: {
    nome: string
    marca: string
    peso: number
    unidade: string
    validade: date
    ingredientes: string[]
    nutrientes: object
    confianca: number
  }
```

### **FRONTEND**

#### 1. Componente de Câmera: `components/CameraCapture.tsx`
- Interface para capturar foto
- Botão para tirar foto
- Preview da imagem
- Opção de tentar novamente

#### 2. Modal de Confirmação: `components/ProductConfirmationModal.tsx`
- Exibe dados extraídos
- Permite edição das informações
- Preview da embalagem
- Botão de salvar

#### 3. Integração na página de Dispensa
- Botão "Adicionar via Câmera" 🎥
- Abre CameraCapture
- Depois abre ProductConfirmationModal
- Salva no banco de dados

---

## 📦 DEPENDÊNCIAS A INSTALAR

### Backend:
```
npm install @tensorflow/tfjs @tensorflow/tfjs-core

# Ou apenas usar Gemini (já instalado)
# Recomendado: Usar apenas Gemini para simplificar
```

### Frontend:
```
npm install next-camera canvas
# ou
npm install html5-qrcode zxing-js/library
```

---

## 🔍 FLUXO DE DADOS

```
Usuário tira foto com câmera
           ↓
Componente CameraCapture captura a imagem
           ↓
Converte para base64
           ↓
Envia para POST /productRecognition/analyze
           ↓
Backend recebe e envia para Gemini Vision
           ↓
Gemini analisa e extrai informações
           ↓
Backend retorna dados estruturados
           ↓
Frontend exibe ProductConfirmationModal
           ↓
Usuário revisa/edita informações
           ↓
Clica em "Salvar"
           ↓
POST /alimentos (ou rota nova AlimentoDoPost)
           ↓
Alimento criado no banco de dados
           ↓
Aparece na lista da Dispensa
```

---

## 🚀 PRÓXIMAS ETAPAS (FUTURO)

1. **OCR Melhorado**: Treinar modelo para leitura de datas especificamente
2. **Code Bar Recognition**: Buscar informações na API Open Food Facts
3. **Histórico de Scanning**: Rastrear todos os produtos já fotografados
4. **ML Model Local**: Para processamento offline
5. **Análise Nutricional**: Comparar produtos e dar recomendações

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

- Gemini Vision tem limite de 15 requisições por minuto (plano gratuito)
- Tamanho máximo de imagem: 20MB
- Formatos suportados: JPEG, PNG, GIF, WebP
- Considerar otimização de imagens antes de enviar
- Implementar feedback ao usuário sobre confiança do reconhecimento

---

## 📊 Datasets Úteis

1. **Open Food Facts**: 
   - URL: https://world.openfoodfacts.org/api/v2/product/{barcode}
   - Possui 800k+ produtos
   
2. **USDA FoodData**: 
   - URL: https://fdc.nal.usda.gov/api/
   - Dados nutricionais precisos

3. **SPOONACULAR API**: Recipes and food data

---

