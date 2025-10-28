package repository

import (
	"context"

	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
)

type HistoryRepository interface {
	GetByItemID(ctx context.Context, itemID int) ([]*entity.ItemHistory, error)
	GetAll(ctx context.Context, filter *entity.HistoryFilter) ([]*entity.ItemHistory, error)
}
