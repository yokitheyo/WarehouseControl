package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/wb-go/wbf/dbpg"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
)

type userRepository struct {
	db *dbpg.DB
}

func NewUserRepository(db *dbpg.DB) *userRepository {
	return &userRepository{db: db}
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*entity.User, error) {
	query := `
		SELECT id, username, password, role, created_at
		FROM users
		WHERE username = $1
	`

	user := &entity.User{}
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID, &user.Username, &user.Password, &user.Role, &user.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, entity.ErrInvalidCredentials
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (r *userRepository) Create(ctx context.Context, user *entity.User) error {
	query := `
		INSERT INTO users (username, password, role)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	err := r.db.QueryRowContext(
		ctx, query,
		user.Username, user.Password, user.Role,
	).Scan(&user.ID, &user.CreatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}
