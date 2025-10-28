package middleware

import (
	"strings"

	"github.com/wb-go/wbf/ginext"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/jwt"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/response"
)

const (
	authorizationHeader = "Authorization"
	userContextKey      = "user"
)

func AuthMiddleware(jwtManager *jwt.Manager) ginext.HandlerFunc {
	return func(c *ginext.Context) {
		authHeader := c.GetHeader(authorizationHeader)
		if authHeader == "" {
			response.Error(c, 401, entity.ErrUnauthorized.Error())
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(c, 401, "invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := parts[1]

		claims, err := jwtManager.Verify(tokenString)
		if err != nil {
			response.Error(c, 401, "invalid token")
			c.Abort()
			return
		}

		user := &entity.User{
			Username: claims.Username,
			Role:     claims.Role,
		}
		c.Set(userContextKey, user)

		c.Next()
	}
}

func GetUserFromContext(c *ginext.Context) (*entity.User, error) {
	value, exists := c.Get(userContextKey)
	if !exists {
		return nil, entity.ErrUnauthorized
	}

	user, ok := value.(*entity.User)
	if !ok {
		return nil, entity.ErrUnauthorized
	}

	return user, nil
}

func AuthPageMiddleware(jwtManager *jwt.Manager) ginext.HandlerFunc {
	return func(c *ginext.Context) {
		token, err := c.Cookie("token")
		if err != nil || token == "" {
			c.Redirect(302, "/login")
			c.Abort()
			return
		}

		claims, err := jwtManager.Verify(token)
		if err != nil {
			c.Redirect(302, "/login")
			c.Abort()
			return
		}

		c.Set("user", &entity.User{
			Username: claims.Username,
			Role:     claims.Role,
		})

		c.Next()
	}
}
