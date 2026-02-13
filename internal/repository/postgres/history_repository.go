package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/wb-go/wbf/dbpg"
	"github.com/wb-go/wbf/zlog"
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

	zlog.Logger.Info().Int("item_id", itemID).Msg("Getting history for item")

	rows, err := r.db.QueryContext(ctx, query, itemID)
	if err != nil {
		zlog.Logger.Error().Err(err).Int("item_id", itemID).Msg("Failed to query history")
		return nil, fmt.Errorf("failed to get history: %w", err)
	}
	defer rows.Close()

	history, err := r.scanHistory(rows)
	if err != nil {
		zlog.Logger.Error().Err(err).Int("item_id", itemID).Msg("Failed to scan history")
		return nil, err
	}

	zlog.Logger.Info().Int("item_id", itemID).Int("count", len(history)).Msg("History loaded successfully")
	return history, nil
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

	zlog.Logger.Info().Interface("filter", filter).Msg("Getting all history")

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		zlog.Logger.Error().Err(err).Msg("Failed to query all history")
		return nil, fmt.Errorf("failed to get history: %w", err)
	}
	defer rows.Close()

	history, err := r.scanHistory(rows)
	if err != nil {
		zlog.Logger.Error().Err(err).Msg("Failed to scan all history")
		return nil, err
	}

	zlog.Logger.Info().Int("count", len(history)).Msg("All history loaded successfully")
	return history, nil
}

func (r *historyRepository) scanHistory(rows interface {
	Next() bool
	Scan(dest ...interface{}) error
	Err() error
}) ([]*entity.ItemHistory, error) {
	var history []*entity.ItemHistory

	for rows.Next() {
		h := &entity.ItemHistory{}
		var oldDataJSON, newDataJSON sql.NullString

		err := rows.Scan(
			&h.ID, &h.ItemID, &h.Action, &h.Username,
			&oldDataJSON, &newDataJSON, &h.ChangedAt,
		)
		if err != nil {
			zlog.Logger.Error().Err(err).Msg("Failed to scan history row")
			return nil, fmt.Errorf("failed to scan history: %w", err)
		}

		if oldDataJSON.Valid && len(oldDataJSON.String) > 0 && !isNull([]byte(oldDataJSON.String)) {
			h.OldData = &entity.Item{}
			if err := json.Unmarshal([]byte(oldDataJSON.String), h.OldData); err != nil {
				zlog.Logger.Error().Err(err).Str("old_data", oldDataJSON.String).Msg("Failed to unmarshal old_data")
				return nil, fmt.Errorf("failed to unmarshal old_data: %w", err)
			}
		}

		if newDataJSON.Valid && len(newDataJSON.String) > 0 && !isNull([]byte(newDataJSON.String)) {
			h.NewData = &entity.Item{}
			if err := json.Unmarshal([]byte(newDataJSON.String), h.NewData); err != nil {
				zlog.Logger.Error().Err(err).Str("new_data", newDataJSON.String).Msg("Failed to unmarshal new_data")
				return nil, fmt.Errorf("failed to unmarshal new_data: %w", err)
			}
		}

		history = append(history, h)
	}

	if err := rows.Err(); err != nil {
		zlog.Logger.Error().Err(err).Msg("Rows iteration error")
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return history, nil
}

func isNull(data []byte) bool {
	if len(data) == 0 {
		return true
	}
	trimmed := strings.TrimSpace(string(data))
	return trimmed == "" || trimmed == "null" || trimmed == "NULL"
}
