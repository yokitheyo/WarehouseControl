# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Копируем go mod файлы
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o /warehouse cmd/api/main.go

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Копируем бинарник из builder
COPY --from=builder /warehouse .

# Копируем конфиги и шаблоны
COPY config ./config
COPY web ./web

EXPOSE 8080

CMD ["./warehouse"]