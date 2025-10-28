package main

import (
	"fmt"
	"log"

	"github.com/wb-go/wbf/dbpg"
	"github.com/wb-go/wbf/ginext"
	"github.com/wb-go/wbf/zlog"

	"github.com/yokitheyo/WarehouseControl/internal/config"
	httpDelivery "github.com/yokitheyo/WarehouseControl/internal/delivery/http"
	"github.com/yokitheyo/WarehouseControl/internal/delivery/http/handler"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/jwt"
	"github.com/yokitheyo/WarehouseControl/internal/repository/postgres"
	"github.com/yokitheyo/WarehouseControl/internal/usecase"
)

func main() {
	// Initialize logger
	zlog.InitConsole()
	zlog.Logger.Info().Msg("Starting Warehouse Control API...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set log level
	if err := zlog.SetLevel("debug"); err != nil {
		log.Fatalf("Failed to set log level: %v", err)
	}

	// Connect to the database
	dbOpts := &dbpg.Options{
		MaxOpenConns:    cfg.Database.MaxOpenConns,
		MaxIdleConns:    cfg.Database.MaxIdleConns,
		ConnMaxLifetime: cfg.Database.ConnMaxLifetime,
	}

	db, err := dbpg.New(cfg.Database.GetDSN(), []string{}, dbOpts)
	if err != nil {
		zlog.Logger.Fatal().Err(err).Msg("Failed to connect to database")
	}
	zlog.Logger.Info().Msg("Successfully connected to database")

	// Initialize repositories
	userRepo := postgres.NewUserRepository(db)
	itemRepo := postgres.NewItemRepository(db)
	historyRepo := postgres.NewHistoryRepository(db)

	// Initialize JWT manager
	jwtManager := jwt.NewManager(cfg.JWT.Secret, cfg.JWT.Expiration)

	// Initialize use cases
	authUseCase := usecase.NewAuthUseCase(userRepo, jwtManager)
	itemUseCase := usecase.NewItemUseCase(itemRepo)
	historyUseCase := usecase.NewHistoryUseCase(historyRepo)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authUseCase)
	itemHandler := handler.NewItemHandler(itemUseCase)
	historyHandler := handler.NewHistoryHandler(historyUseCase)

	// Create Gin Engine
	engine := ginext.New(cfg.Server.Mode)

	// Apply middlewares
	engine.Use(ginext.Logger())
	engine.Use(ginext.Recovery())

	// Configure routes
	httpDelivery.SetupRouter(engine, authHandler, itemHandler, historyHandler, jwtManager)

	// Start the server
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	zlog.Logger.Info().Str("address", addr).Msg("Starting HTTP server")

	if err := engine.Run(addr); err != nil {
		zlog.Logger.Fatal().Err(err).Msg("Failed to start server")
	}
}
