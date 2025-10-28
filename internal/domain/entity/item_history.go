package entity

import "time"

type HistoryAction string

const (
	ActionInsert HistoryAction = "INSERT"
	ActionUpdate HistoryAction = "UPDATE"
	ActionDelete HistoryAction = "DELETE"
)

type ItemHistory struct {
	ID        int           `json:"id"`
	ItemID    int           `json:"item_id"`
	Action    HistoryAction `json:"action"`
	Username  string        `json:"username"`
	OldData   *Item         `json:"old_data,omitempty"`
	NewData   *Item         `json:"new_data,omitempty"`
	ChangedAt time.Time     `json:"changed_at"`
}

type HistoryFilter struct {
	ItemID   *int
	Username *string
	Action   *HistoryAction
	DateFrom *time.Time
	DateTo   *time.Time
	Limit    int
	Offset   int
}
