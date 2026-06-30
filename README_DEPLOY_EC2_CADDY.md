# Deploy do FoodFlow em uma EC2 com Caddy e HTTPS

Este guia descreve como subir o projeto FoodFlow inteiro em uma instância EC2 da AWS usando Caddy para HTTPS. A abordagem prioriza menor custo e, quando a conta for elegível, uso dentro da camada gratuita.

## 1. Visão geral da arquitetura

Arquitetura recomendada para menor custo:

```text
Usuário
  |
  | HTTPS
  v
Caddy :80/:443
  |-- /api/*  -> Backend Express em localhost:3001
  |-- /*      -> Frontend Next exportado em /var/www/foodflow

Backend Express + Prisma
  |
  v
PostgreSQL externo, preferencialmente Neon/Supabase free tier
```

Por que esta arquitetura:

- O Caddy emite e renova certificados HTTPS automaticamente.
- O frontend pode ser servido como arquivo estático, reduzindo uso de RAM/CPU.
- O backend fica como processo Node.js gerenciado por PM2.
- O banco fora da EC2 evita manter PostgreSQL rodando na instância micro.

> Observação de custo: a AWS costuma oferecer 750 horas/mês de instância EC2 Linux `t2.micro` ou `t3.micro` por 12 meses, dependendo da região e elegibilidade da conta. Configure alerta de orçamento antes de criar recursos.

## 2. Pré-requisitos

Você vai precisar de:

- Conta AWS.
- Domínio ou subdomínio apontando para a EC2.
- Chaves do projeto:
  - `DATABASE_URL`
  - `JWT_KEY`
  - `GEMINI_API_KEY`
  - `GOOGLE_API_KEY`
  - `NEXT_PUBLIC_URL_API`
  - `NEXT_PUBLIC_GEMINI_API_KEY`
- Repositório do FoodFlow acessível por Git ou enviado por SCP.

Exemplo de domínio usado neste guia:

```text
foodflow.seudominio.com
```

## 3. Criar a EC2 com menor custo

Na AWS Console:

1. Acesse `EC2 > Instances > Launch instance`.
2. Nome: `foodflow-prod`.
3. AMI: `Ubuntu Server 24.04 LTS` ou `Ubuntu Server 22.04 LTS`.
4. Tipo:
   - Preferencial para Free Tier: `t3.micro` ou `t2.micro`, conforme disponibilidade na região.
   - Para custo baixo fora do Free Tier: `t4g.micro` pode ser barato, mas exige ARM64. Use apenas se suas dependências compilarem bem em ARM.
5. Par de chaves: crie ou escolha uma chave `.pem`.
6. Storage:
   - 16 GB `gp3` é suficiente para este projeto.
   - Se quiser maximizar folga no free tier, use até o limite gratuito disponível na sua conta.
7. Security Group:
   - SSH `22`: restrinja ao seu IP.
   - HTTP `80`: aberto para `0.0.0.0/0`.
   - HTTPS `443`: aberto para `0.0.0.0/0`.
   - Não abra `3000` nem `3001` publicamente.

Depois, associe um Elastic IP se quiser IP fixo. Atenção: Elastic IP parado ou não associado pode gerar cobrança.

## 4. Apontar DNS

No seu provedor de DNS, crie:

```text
Tipo: A
Nome: foodflow
Valor: IP público da EC2
TTL: 300
```

Teste:

```bash
nslookup foodflow.seudominio.com
```

O domínio precisa apontar para a EC2 antes do Caddy emitir o certificado.

## 5. Acessar a instância

No seu computador:

```bash
chmod 400 sua-chave.pem
ssh -i sua-chave.pem ubuntu@IP_PUBLICO_DA_EC2
```

Atualize o sistema:

```bash
sudo apt update
sudo apt upgrade -y
```

## 6. Instalar dependências do servidor

Instale ferramentas básicas:

```bash
sudo apt install -y git curl unzip build-essential
```

Instale Node.js LTS via NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Instale PM2:

```bash
sudo npm install -g pm2
pm2 -v
```

Instale Caddy:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
caddy version
```

## 7. Criar usuário e pastas da aplicação

```bash
sudo mkdir -p /opt/foodflow
sudo mkdir -p /var/www/foodflow
sudo chown -R ubuntu:ubuntu /opt/foodflow /var/www/foodflow
```

Clone o projeto:

```bash
cd /opt/foodflow
git clone URL_DO_REPOSITORIO foodflow
cd foodflow
```

Se você não usa Git remoto, envie a pasta com:

```bash
scp -i sua-chave.pem -r ./foodflow ubuntu@IP_PUBLICO_DA_EC2:/opt/foodflow/foodflow
```

## 8. Configurar banco PostgreSQL

Para menor custo, recomendo usar banco externo com plano gratuito, como Neon ou Supabase.

No painel do provedor:

1. Crie um projeto PostgreSQL.
2. Copie a connection string.
3. Ela será usada como `DATABASE_URL`.

Exemplo:

```env
DATABASE_URL="postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require"
```

Evite rodar PostgreSQL na própria EC2 micro, porque banco + backend + build do frontend podem consumir memória demais.

## 9. Configurar variáveis do backend

Crie o arquivo:

```bash
cd /opt/foodflow/foodflow/back
nano .env
```

Conteúdo:

```env
DATABASE_URL="postgresql://usuario:senha@host/neondb?sslmode=require"
JWT_KEY="troque-por-uma-chave-grande-e-aleatoria"
GEMINI_API_KEY="sua-chave-gemini"
GOOGLE_API_KEY="sua-chave-google"
NODE_ENV="production"
```

Gere uma chave JWT forte:

```bash
openssl rand -base64 48
```

## 10. Instalar e preparar backend

```bash
cd /opt/foodflow/foodflow/back
npm ci
npx prisma generate
npx prisma migrate deploy
```

Teste o backend:

```bash
npm run dev
```

Em outro terminal:

```bash
curl http://localhost:3001/
```

Pare o processo manual com `Ctrl+C`.

## 11. Rodar backend com PM2

Como o projeto já usa `ts-node-dev` em `npm run dev`, ele funciona, mas para produção é melhor rodar com `ts-node` ou compilar TypeScript. Para menor alteração no projeto, use PM2 chamando o script atual:

```bash
cd /opt/foodflow/foodflow/back
pm2 start npm --name foodflow-api -- run dev
pm2 save
pm2 startup
```

O comando `pm2 startup` vai imprimir um comando com `sudo`. Copie e execute.

Verifique:

```bash
pm2 status
pm2 logs foodflow-api
curl http://localhost:3001/
```

> Melhor melhoria futura: criar um script `build` no backend com `tsc` e rodar `node dist/index.js`, em vez de usar `ts-node-dev` em produção.

## 12. Configurar variáveis do frontend

Crie:

```bash
cd /opt/foodflow/foodflow/front
nano .env.local
```

Conteúdo:

```env
NEXT_PUBLIC_URL_API=https://foodflow.seudominio.com/api
NEXT_PUBLIC_GEMINI_API_KEY=sua-chave-gemini
```

Importante:

- `NEXT_PUBLIC_URL_API` é gravado no build do Next.
- Sempre que mudar essa URL, rode o build novamente.

## 13. Frontend: opção A, estático com Caddy

Esta é a opção de menor custo, porque não mantém um servidor Next rodando.

O projeto possui configuração `output: 'export'` em `front/next.config.ts`, então tente:

```bash
cd /opt/foodflow/foodflow/front
npm ci
npm run build
```

Se o build gerar a pasta `out`, publique:

```bash
rm -rf /var/www/foodflow/*
cp -r out/* /var/www/foodflow/
```

Se o build falhar por causa de rotas dinâmicas do Next export, use a opção B.

## 14. Frontend: opção B, servidor Next com PM2

Use esta opção se o export estático falhar.

Edite `front/next.config.ts` e remova:

```ts
output: 'export',
```

Depois:

```bash
cd /opt/foodflow/foodflow/front
npm ci
npm run build
pm2 start npm --name foodflow-web -- start
pm2 save
```

Teste:

```bash
curl http://localhost:3000
```

Esta opção usa mais RAM do que servir arquivos estáticos.

## 15. Configurar Caddy com HTTPS

Edite:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Caddyfile para opção A, frontend estático

```caddyfile
foodflow.seudominio.com {
	encode gzip zstd

	handle_path /api/* {
		reverse_proxy localhost:3001
	}

	root * /var/www/foodflow
	try_files {path} {path}/ /index.html
	file_server
}
```

### Caddyfile para opção B, frontend em Next server

```caddyfile
foodflow.seudominio.com {
	encode gzip zstd

	handle_path /api/* {
		reverse_proxy localhost:3001
	}

	reverse_proxy localhost:3000
}
```

Valide e recarregue:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

Teste:

```bash
curl -I https://foodflow.seudominio.com
curl https://foodflow.seudominio.com/api/
```

O Caddy emite HTTPS automaticamente quando:

- O domínio aponta para a EC2.
- Portas `80` e `443` estão abertas.
- O Caddy consegue responder publicamente pelo domínio.

## 16. Ajuste importante sobre `/api`

O backend FoodFlow hoje registra rotas como:

```text
/clientes
/clientes/login
/dispensa
/alimentos
/notasFiscais
```

No Caddyfile usamos:

```caddyfile
handle_path /api/* {
	reverse_proxy localhost:3001
}
```

Isso remove o prefixo `/api` antes de enviar ao backend. Assim:

```text
https://foodflow.seudominio.com/api/clientes/login
```

chega no backend como:

```text
/clientes/login
```

Por isso o frontend deve usar:

```env
NEXT_PUBLIC_URL_API=https://foodflow.seudominio.com/api
```

## 17. Configurar firewall Ubuntu

Opcional, mas recomendado:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```

Não libere `3000` nem `3001`.

## 18. Atualizar aplicação depois de um commit novo

Backend:

```bash
cd /opt/foodflow/foodflow
git pull
cd back
npm ci
npx prisma generate
npx prisma migrate deploy
pm2 restart foodflow-api
```

Frontend opção A:

```bash
cd /opt/foodflow/foodflow/front
npm ci
npm run build
rm -rf /var/www/foodflow/*
cp -r out/* /var/www/foodflow/
sudo systemctl reload caddy
```

Frontend opção B:

```bash
cd /opt/foodflow/foodflow/front
npm ci
npm run build
pm2 restart foodflow-web
```

## 19. Logs e diagnóstico

PM2:

```bash
pm2 status
pm2 logs foodflow-api
pm2 logs foodflow-web
```

Caddy:

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -f
```

Portas:

```bash
sudo ss -tulpn | grep -E ':80|:443|:3000|:3001'
```

Backend:

```bash
curl http://localhost:3001/
curl https://foodflow.seudominio.com/api/
```

## 20. Checklist para evitar cobrança inesperada

- Crie AWS Budget com alerta em `US$ 1` ou `US$ 5`.
- Use apenas uma EC2 micro ligada.
- Não deixe Elastic IP desassociado.
- Evite NAT Gateway, Load Balancer e RDS se o objetivo for custo zero.
- Use banco externo free tier em vez de RDS.
- Não abra portas internas publicamente.
- Desligue ou encerre a instância se não estiver usando.
- Monitore Free Tier em `Billing and Cost Management`.

## 21. Segurança mínima recomendada

- Troque `JWT_KEY` por valor forte.
- Não commite `.env` nem `.env.local`.
- Restrinja SSH ao seu IP.
- Use usuário sem senha, apenas chave SSH.
- Rode Prisma migrations apenas a partir do servidor ou pipeline confiável.
- Faça backup do banco externo.
- Configure logs para acompanhar erros de IA, NFC-e e autenticação.

## 22. Referências úteis

- AWS Free Tier: https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html
- EC2 Free Tier, 750 horas/mês micro: https://docs.aws.amazon.com/cur/latest/userguide/product-columns.html
- Caddy reverse proxy: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- Caddy static files: https://caddyserver.com/docs/caddyfile/directives/file_server
- Caddy automatic HTTPS: https://caddyserver.com/docs/caddyfile/options

