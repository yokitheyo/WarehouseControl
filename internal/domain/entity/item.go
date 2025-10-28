package entity

import "time"

type Item struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Quantity    int       `json:"quantity"`
	Price       float64   `json:"price"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
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
