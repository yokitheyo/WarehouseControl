package entity

import "errors"

var (
	ErrItemNotFound       = errors.New("item not found")
	ErrInvalidItemName    = errors.New("invalid item name")
	ErrInvalidQuantity    = errors.New("quantity cannot be negative")
	ErrInvalidPrice       = errors.New("price cannot be negative")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrInvalidCredentials = errors.New("invalid credentials")
)
