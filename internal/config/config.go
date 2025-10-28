package config

import (
	"fmt"
	"time"

	"github.com/wb-go/wbf/config"
	"github.com/wb-go/wbf/zlog"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Host string
	Port int
	Mode string
}

type DatabaseConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	DBName          string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type JWTConfig struct {
	Secret     string
	Expiration time.Duration
}

func Load() (*Config, error) {
	cfg := config.New()

	if err := cfg.LoadEnvFiles(".env"); err != nil {
		zlog.Logger.Error().Err(err).Msg("Failed to load .env file")
	} else {
		zlog.Logger.Info().Msg("Environment variables loaded successfully")
	}

	cfg.EnableEnv("APP")

	if err := cfg.LoadConfigFiles("config/config.yaml"); err != nil {
		return nil, fmt.Errorf("failed to load config file: %w", err)
	}

	cfg.SetDefault("server.host", "0.0.0.0")
	cfg.SetDefault("server.port", 8080)
	cfg.SetDefault("server.mode", "debug")
	cfg.SetDefault("database.max_open_conns", 25)
	cfg.SetDefault("database.max_idle_conns", 5)
	cfg.SetDefault("database.conn_max_lifetime", "5m")
	cfg.SetDefault("jwt.expiration", "24h")

	appConfig := &Config{
		Server: ServerConfig{
			Host: cfg.GetString("server.host"),
			Port: cfg.GetInt("server.port"),
			Mode: cfg.GetString("server.mode"),
		},
		Database: DatabaseConfig{
			Host:            cfg.GetString("database.host"),
			Port:            cfg.GetInt("database.port"),
			User:            cfg.GetString("database.user"),
			Password:        cfg.GetString("database.password"),
			DBName:          cfg.GetString("database.dbname"),
			MaxOpenConns:    cfg.GetInt("database.max_open_conns"),
			MaxIdleConns:    cfg.GetInt("database.max_idle_conns"),
			ConnMaxLifetime: cfg.GetDuration("database.conn_max_lifetime"),
		},
		JWT: JWTConfig{
			Secret:     cfg.GetString("jwt.secret"),
			Expiration: cfg.GetDuration("jwt.expiration"),
		},
	}

	if appConfig.Database.Host == "" {
		return nil, fmt.Errorf("database.host is required")
	}
	if appConfig.Database.User == "" {
		return nil, fmt.Errorf("database.user is required")
	}
	if appConfig.Database.DBName == "" {
		return nil, fmt.Errorf("database.dbname is required")
	}
	if appConfig.JWT.Secret == "" {
		return nil, fmt.Errorf("jwt.secret is required")
	}

	return appConfig, nil
}

func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		c.Host, c.Port, c.User, c.Password, c.DBName,
	)
}
