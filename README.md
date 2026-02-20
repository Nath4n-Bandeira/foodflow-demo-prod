
# Continuidade Foodflow - Projeto de desenvolvimento

## Autores

- **Nathan** – CodeBase, fullstack, prototipação inicial, wireworking, e prototipação  
- **Guilherme** – Refatoração visual do design, documentação  


---

## 📌 Proposta

**Foodflow** é uma proposta de site com o objetivo de simplificar o armazenamento de alimentos no dia a dia, tanto em ambientes **profissionais** quanto **domésticos**.

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- Node.js instalado
- Git instalado (opcional, se for clonar o repositório)
- Banco de dados compatível com o Prisma (ex: PostgreSQL)

### Passo a passo

#### 1. Clone o repositório ou baixe o `.zip`

```bash
git clone <url-do-repositorio>

# Proposta 

Foodflow é uma proposta de site com o intuito de simplificar o amarzenaento de alimentos no dia-a-dia <br />
tanto no profissional quanto no caseiro.

# Como rodar 

considerando que você tenha dado um git clone ou baixado o .zip <br />

Na pasta back-end

# Npm i --force (--force para forçar as dependencias não seguras instalarem) <br />
# Npx prisma generate, npx prisma migrate dev -name "nomeaqui", para o prisma gerar as tabelas que existem no prisma.schema
# Crie um .env dentro da pasta backend e escreva:

DATABASE_URL="O endereço do seu banco De dados" <br />
JWT_KEY="CHAVE12345TESTEEE"

# Npm run dev (Roda o script dev e suas dependencias, assim ligando o servidor )

Na pasta front-end Repita os mesmos passos, assim ligando o servidor responsável pelo front-end 

# Acesse no seu navegador: Localhost:3001 para ter acesso ao front-end e utilizar o projeto :)
# Foodflow-Prod-demo
# Foodflow-Prod-demo
# foodflow-demo-prod
