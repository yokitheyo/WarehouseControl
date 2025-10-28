package entity

import "time"

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleManager Role = "manager"
	RoleViewer  Role = "viewer"
)

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func (u *User) CanCreate() bool {
	return u.Role == RoleAdmin || u.Role == RoleManager
}

func (u *User) CanUpdate() bool {
	return u.Role == RoleAdmin || u.Role == RoleManager
}

func (u *User) CanDelete() bool {
	return u.Role == RoleAdmin
}

func (u *User) CanView() bool {
	return true
}

func (u *User) CanViewHistory() bool {
	return true
}
