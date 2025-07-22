# Простой Dockerfile для Next.js приложения (одноэтапная сборка)
FROM node:18-alpine

# Установка рабочей директории
WORKDIR /app

# Установка зависимостей для libc6-compat (нужно для Alpine)
RUN apk add --no-cache libc6-compat

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование всех файлов приложения
COPY . .

# Отключение телеметрии Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Сборка приложения
RUN npm run build

# Открытие порта 3000
EXPOSE 3000

# Установка переменной окружения для порта
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запуск приложения
CMD ["npm", "start"]