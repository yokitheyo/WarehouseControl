package entity

const (
	AuthorizationHeader = "Authorization"
	UserContextKey      = "user"
)

const (
	RoleAdmin   Role = "admin"
	RoleManager Role = "manager"
	RoleViewer  Role = "viewer"
)

const (
	ActionInsert HistoryAction = "INSERT"
	ActionUpdate HistoryAction = "UPDATE"
	ActionDelete HistoryAction = "DELETE"
)
