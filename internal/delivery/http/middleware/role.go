package middleware

import (
	"github.com/wb-go/wbf/ginext"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/response"
)

func RequireRole(roles ...entity.Role) ginext.HandlerFunc {
	return func(c *ginext.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Error(c, 401, entity.ErrUnauthorized.Error())
			c.Abort()
			return
		}

		hasRole := false
		for _, role := range roles {
			if user.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			response.Error(c, 403, entity.ErrForbidden.Error())
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireCreatePermission() ginext.HandlerFunc {
	return func(c *ginext.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Error(c, 401, entity.ErrUnauthorized.Error())
			c.Abort()
			return
		}

		if !user.CanCreate() {
			response.Error(c, 403, entity.ErrForbidden.Error())
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireUpdatePermission() ginext.HandlerFunc {
	return func(c *ginext.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Error(c, 401, entity.ErrUnauthorized.Error())
			c.Abort()
			return
		}

		if !user.CanUpdate() {
			response.Error(c, 403, entity.ErrForbidden.Error())
			c.Abort()
			return
		}

		c.Next()
	}
}

func RequireDeletePermission() ginext.HandlerFunc {
	return func(c *ginext.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Error(c, 401, entity.ErrUnauthorized.Error())
			c.Abort()
			return
		}

		if !user.CanDelete() {
			response.Error(c, 403, entity.ErrForbidden.Error())
			c.Abort()
			return
		}

		c.Next()
	}
}
