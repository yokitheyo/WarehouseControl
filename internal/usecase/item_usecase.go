package usecase

import (
	"context"
	"fmt"

	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/domain/repository"
)

type ItemUseCase struct {
	itemRepo repository.ItemRepository
}

func NewItemUseCase(itemRepo repository.ItemRepository) *ItemUseCase {
	return &ItemUseCase{
		itemRepo: itemRepo,
	}
}

func (uc *ItemUseCase) Create(ctx context.Context, item *entity.Item, username string) error {
	if err := item.Validate(); err != nil {
		return err
	}

	if err := uc.itemRepo.Create(ctx, item, username); err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	return nil
}

func (uc *ItemUseCase) GetByID(ctx context.Context, id int) (*entity.Item, error) {
	item, err := uc.itemRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (uc *ItemUseCase) GetAll(ctx context.Context) ([]*entity.Item, error) {
	items, err := uc.itemRepo.GetAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get items: %w", err)
	}

	return items, nil
}

func (uc *ItemUseCase) Update(ctx context.Context, item *entity.Item, username string) error {
	if err := item.Validate(); err != nil {
		return err
	}

	if err := uc.itemRepo.Update(ctx, item, username); err != nil {
		return err
	}

	return nil
}

func (uc *ItemUseCase) Delete(ctx context.Context, id int, username string) error {
	if err := uc.itemRepo.Delete(ctx, id, username); err != nil {
		return err
	}

	return nil
}
