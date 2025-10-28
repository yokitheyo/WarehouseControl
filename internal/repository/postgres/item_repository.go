package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/wb-go/wbf/dbpg"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
)

type itemRepository struct {
	db *dbpg.DB
}

func NewItemRepository(db *dbpg.DB) *itemRepository {
	return &itemRepository{db: db}
}

func (r *itemRepository) Create(ctx context.Context, item *entity.Item, username string) error {
	query := `
		INSERT INTO items (name, description, quantity, price, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(
		ctx, query,
		item.Name, item.Description, item.Quantity, item.Price, username,
	).Scan(&item.ID, &item.CreatedAt, &item.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	return nil
}

func (r *itemRepository) GetByID(ctx context.Context, id int) (*entity.Item, error) {
	query := `
		SELECT id, name, description, quantity, price, created_at, updated_at
		FROM items
		WHERE id = $1 AND deleted_at IS NULL
	`

	item := &entity.Item{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.Name, &item.Description,
		&item.Quantity, &item.Price, &item.CreatedAt, &item.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, entity.ErrItemNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	return item, nil
}

func (r *itemRepository) GetAll(ctx context.Context) ([]*entity.Item, error) {
	query := `
		SELECT id, name, description, quantity, price, created_at, updated_at
		FROM items
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get items: %w", err)
	}
	defer rows.Close()

	var items []*entity.Item
	for rows.Next() {
		item := &entity.Item{}
		err := rows.Scan(
			&item.ID, &item.Name, &item.Description,
			&item.Quantity, &item.Price, &item.CreatedAt, &item.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan item: %w", err)
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return items, nil
}

func (r *itemRepository) Update(ctx context.Context, item *entity.Item, username string) error {
	query := `
		UPDATE items
		SET name = $1, description = $2, quantity = $3, price = $4, 
		    updated_at = NOW(), updated_by = $5
		WHERE id = $6 AND deleted_at IS NULL
		RETURNING updated_at
	`

	err := r.db.QueryRowContext(
		ctx, query,
		item.Name, item.Description, item.Quantity, item.Price, username, item.ID,
	).Scan(&item.UpdatedAt)

	if err == sql.ErrNoRows {
		return entity.ErrItemNotFound
	}
	if err != nil {
		return fmt.Errorf("failed to update item: %w", err)
	}

	return nil
}

func (r *itemRepository) Delete(ctx context.Context, id int, username string) error {
	query := `
		UPDATE items
		SET deleted_at = NOW(), deleted_by = $1
		WHERE id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, username, id)
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return entity.ErrItemNotFound
	}

	return nil
}
