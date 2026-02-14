package entity

import (
	"fmt"
	"strings"
	"time"
)

type Item struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Price       float64  `json:"price"`
	Quantity    int      `json:"quantity"`
	CreatedAt   JSONTime `json:"created_at"`
	UpdatedAt   JSONTime `json:"updated_at"`
	Description string   `json:"description"`
}

func (i *Item) Validate() error {
	if i.Name == "" {
		return ErrInvalidItemName
	}
	if i.Quantity < 0 {
		return ErrInvalidQuantity
	}
	if i.Price < 0 {
		return ErrInvalidPrice
	}
	return nil
}

type JSONTime time.Time

func (t *JSONTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	if s == "null" || s == "" {
		return nil
	}
	parsed, err := time.Parse("2006-01-02T15:04:05.999999", s)
	if err != nil {
		return fmt.Errorf("cannot parse time %q: %w", s, err)
	}
	*t = JSONTime(parsed)
	return nil
}

func (t JSONTime) MarshalJSON() ([]byte, error) {
	return []byte(`"` + time.Time(t).Format("2006-01-02T15:04:05.999999") + `"`), nil
}
