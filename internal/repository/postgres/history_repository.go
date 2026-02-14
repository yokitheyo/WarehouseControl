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
	"github.com/yokitheyo/WarehouseControl/internal/domain/repository"
)

type historyRepository struct {
	db *dbpg.DB
}

func NewHistoryRepository(db *dbpg.DB) repository.HistoryRepository {
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
	defer func() {
		if err := rows.Close(); err != nil {
			zlog.Logger.Error().Err(err).Msg("Failed to close rows")
		}
	}()

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
	var args []interface{}
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

	defer func() {
		if err := rows.Close(); err != nil {
			zlog.Logger.Error().Err(err).Msg("Failed to close rows")
		}
	}()

	history, err := r.scanHistory(rows)
	if err != nil {
		zlog.Logger.Error().Err(err).Msg("Failed to scan all history")
		return nil, err
	}

	zlog.Logger.Info().Int("count", len(history)).Msg("All history loaded successfully")
	return history, nil
}

func (r *historyRepository) Create(ctx context.Context, history *entity.ItemHistory) error {
	query := `
		INSERT INTO items_history (item_id, action, username, old_data, new_data, changed_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, changed_at
	`

	var oldJSON, newJSON []byte
	var err error

	if history.OldData != nil {
		oldJSON, err = json.Marshal(history.OldData)
		if err != nil {
			return fmt.Errorf("failed to marshal old_data: %w", err)
		}
	}
	if history.NewData != nil {
		newJSON, err = json.Marshal(history.NewData)
		if err != nil {
			return fmt.Errorf("failed to marshal new_data: %w", err)
		}
	}

	err = r.db.QueryRowContext(
		ctx, query,
		history.ItemID, history.Action, history.Username,
		oldJSON, newJSON,
	).Scan(&history.ID, &history.ChangedAt)

	if err != nil {
		return fmt.Errorf("failed to insert history: %w", err)
	}

	return nil
}

func (r *historyRepository) scanHistory(rows *sql.Rows) ([]*entity.ItemHistory, error) {
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

		if h.OldData, err = unmarshalItem(oldDataJSON); err != nil {
			return nil, err
		}
		if h.NewData, err = unmarshalItem(newDataJSON); err != nil {
			return nil, err
		}

		history = append(history, h)
	}

	if err := rows.Err(); err != nil {
		zlog.Logger.Error().Err(err).Msg("Rows iteration error")
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	return history, nil
}

func unmarshalItem(data sql.NullString) (*entity.Item, error) {
	if !data.Valid || len(strings.TrimSpace(data.String)) == 0 || strings.ToLower(strings.TrimSpace(data.String)) == "null" {
		return nil, nil
	}
	item := &entity.Item{}
	if err := json.Unmarshal([]byte(data.String), item); err != nil {
		zlog.Logger.Error().Err(err).Str("data", data.String).Msg("Failed to unmarshal item")
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}
	return item, nil
}
