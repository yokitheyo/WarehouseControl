package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wb-go/wbf/dbpg"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
)

type historyRepository struct {
	db *dbpg.DB
}

func NewHistoryRepository(db *dbpg.DB) *historyRepository {
	return &historyRepository{db: db}
}

func (r *historyRepository) GetByItemID(ctx context.Context, itemID int) ([]*entity.ItemHistory, error) {
	query := `
		SELECT id, item_id, action, username, old_data, new_data, changed_at
		FROM items_history
		WHERE item_id = $1
		ORDER BY changed_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, itemID)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %w", err)
	}
	defer rows.Close()

	return r.scanHistory(rows)
}

func (r *historyRepository) GetAll(ctx context.Context, filter *entity.HistoryFilter) ([]*entity.ItemHistory, error) {
	query := `SELECT id, item_id, action, username, old_data, new_data, changed_at FROM items_history WHERE 1=1`
	args := []interface{}{}
	argPos := 1

	if filter.ItemID != nil {
		query += fmt.Sprintf(" AND item_id = $%d", argPos)
		args = append(args, *filter.ItemID)
		argPos++
	}

	if filter.Username != nil {
		query += fmt.Sprintf(" AND username = $%d", argPos)
		args = append(args, *filter.Username)
		argPos++
	}

	if filter.Action != nil {
		query += fmt.Sprintf(" AND action = $%d", argPos)
		args = append(args, *filter.Action)
		argPos++
	}

	if filter.DateFrom != nil {
		query += fmt.Sprintf(" AND changed_at >= $%d", argPos)
		args = append(args, *filter.DateFrom)
		argPos++
	}

	if filter.DateTo != nil {
		query += fmt.Sprintf(" AND changed_at <= $%d", argPos)
		args = append(args, *filter.DateTo)
		argPos++
	}

	query += " ORDER BY changed_at DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argPos)
		args = append(args, filter.Limit)
		argPos++
	}

	if filter.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argPos)
		args = append(args, filter.Offset)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %w", err)
	}
	defer rows.Close()

	return r.scanHistory(rows)
}

func (r *historyRepository) scanHistory(rows interface {
	Next() bool
	Scan(dest ...interface{}) error
	Err() error
}) ([]*entity.ItemHistory, error) {
	var history []*entity.ItemHistory

	for rows.Next() {
		h := &entity.ItemHistory{}
		var oldDataJSON, newDataJSON []byte

		err := rows.Scan(
			&h.ID, &h.ItemID, &h.Action, &h.Username,
			&oldDataJSON, &newDataJSON, &h.ChangedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan history: %w", err)
		}

		if len(oldDataJSON) > 0 && !isNull(oldDataJSON) {
			h.OldData = &entity.Item{}
			if err := json.Unmarshal(oldDataJSON, h.OldData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal old_data: %w", err)
			}
		}

		if len(newDataJSON) > 0 && !isNull(newDataJSON) {
			h.NewData = &entity.Item{}
			if err := json.Unmarshal(newDataJSON, h.NewData); err != nil {
				return nil, fmt.Errorf("failed to unmarshal new_data: %w", err)
			}
		}

		history = append(history, h)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return history, nil
}

func isNull(data []byte) bool {
	return len(data) == 0 || strings.TrimSpace(string(data)) == "null"
}
