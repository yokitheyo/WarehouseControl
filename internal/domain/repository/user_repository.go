package repository

import (
	"context"

	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
)

type UserRepository interface {
	GetByUsername(ctx context.Context, username string) (*entity.User, error)
	Create(ctx context.Context, user *entity.User) error
}
