# ─────────────────────────────────────────────
# Stage base: dependências compartilhadas
# ─────────────────────────────────────────────
FROM node:22-alpine AS base

WORKDIR /app

# Copia apenas os manifestos para aproveitar o cache do Docker
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

# ─────────────────────────────────────────────
# Stage development: hot-reload
# ─────────────────────────────────────────────
FROM base AS development

# Instala TODAS as dependências (inclui devDependencies)
RUN npm install

# O código-fonte NÃO é copiado aqui — ele chega via volume no Compose
# Isso permite que o hot-reload reflita edições do host em tempo real

# Polling é necessário porque inotify (usado pelo chokidar/nest watch) não
# funciona corretamente em filesystems montados via bind mount no Linux/Docker.
ENV CHOKIDAR_USEPOLLING=1
ENV WATCHPACK_POLLING=true

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

# ─────────────────────────────────────────────
# Stage build: compila o TypeScript
# ─────────────────────────────────────────────
FROM base AS build

RUN npm install

COPY . .

RUN npm run build

# ─────────────────────────────────────────────
# Stage production: imagem enxuta
# ─────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copia apenas package.json para instalar somente produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia o artefato compilado do stage build
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
