package repository

import (
	"context"

	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
)

type ItemRepository interface {
	Create(ctx context.Context, item *entity.Item, username string) error
	GetByID(ctx context.Context, id int) (*entity.Item, error)
	GetAll(ctx context.Context) ([]*entity.Item, error)
	Update(ctx context.Context, item *entity.Item, username string) error
	Delete(ctx context.Context, id int, username string) error
}
