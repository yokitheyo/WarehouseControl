# Warehouse Control API

A Go-based API for managing warehouse operations with user authentication, inventory tracking, and activity logging.

## Features

- User authentication with JWT tokens
- Inventory management (items tracking)
- Activity history logging
- RESTful API design
- PostgreSQL database integration
- Docker and Docker Compose support

## Prerequisites

- Go 1.24+
- Docker and Docker Compose (optional, for containerized deployment)
- PostgreSQL (if running locally without Docker)

## Getting Started

### Option 1: Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yokitheyo/WarehouseControl.git
cd WarehouseControl
```

2. Start the services using Docker Compose:
```bash
docker-compose up --build
```

The API will be available at `http://localhost:8080`.

### Option 2: Local Development

1. Clone the repository:
```bash
git clone https://github.com/yokitheyo/WarehouseControl.git
cd WarehouseControl
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables by copying `.env-example` to `.env`:
```bash
cp config/.env-example .env
```

4. Update the `.env` file with your database connection details.

5. Run the application:
```bash
go run cmd/api/main.go
```

The API will be available at `http://localhost:8080`.

## Configuration

The application can be configured via:
- Environment variables (`.env` file)
- `config/config.yaml` file

Key configuration options:
- Server host and port
- Database connection parameters
- JWT secret and expiration time

## Project Structure

- `cmd/api/main.go` - Application entry point
- `internal/config` - Configuration management
- `internal/delivery` - HTTP handlers and routing
- `internal/domain` - Business entities
- `internal/repository` - Data access layer
- `internal/usecase` - Business logic
- `config/` - Configuration files
- `migrations/` - Database migration scripts

## API Endpoints

The API provides endpoints for:
- Authentication (login/register)
- Item management (CRUD operations)
- History tracking (audit logs)
