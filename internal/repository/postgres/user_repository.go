package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/wb-go/wbf/dbpg"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/domain/repository"
)

type userRepository struct {
	db *dbpg.DB
}

func NewUserRepository(db *dbpg.DB) repository.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*entity.User, error) {
	const query = `
		SELECT id, username, password, role, created_at
		FROM users
		WHERE username = $1
	`

	user := &entity.User{}
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID, &user.Username, &user.Password, &user.Role, &user.CreatedAt,
	)

	switch {
	case errors.Is(err, sql.ErrNoRows):
		return nil, entity.ErrInvalidCredentials
	case err != nil:
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return user, nil
}

func (r *userRepository) Create(ctx context.Context, user *entity.User) error {
	const query = `
		INSERT INTO users (username, password, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err := r.db.QueryRowContext(ctx, query, user.Username, user.Password, user.Role).
		Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}
