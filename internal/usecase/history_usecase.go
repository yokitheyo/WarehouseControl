package usecase

import (
	"context"
	"fmt"

	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/domain/repository"
)

type HistoryUseCase struct {
	historyRepo repository.HistoryRepository
}

func NewHistoryUseCase(historyRepo repository.HistoryRepository) *HistoryUseCase {
	return &HistoryUseCase{
		historyRepo: historyRepo,
	}
}

func (uc *HistoryUseCase) GetByItemID(ctx context.Context, itemID int) ([]*entity.ItemHistory, error) {
	history, err := uc.historyRepo.GetByItemID(ctx, itemID)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %w", err)
	}

	return history, nil
}

func (uc *HistoryUseCase) GetAll(ctx context.Context, filter *entity.HistoryFilter) ([]*entity.ItemHistory, error) {
	history, err := uc.historyRepo.GetAll(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %w", err)
	}

	return history, nil
}
