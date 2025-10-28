package http

import (
	"github.com/gin-gonic/gin"
	"github.com/wb-go/wbf/ginext"
	"github.com/yokitheyo/WarehouseControl/internal/delivery/http/handler"
	"github.com/yokitheyo/WarehouseControl/internal/delivery/http/middleware"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/jwt"
)

func SetupRouter(
	engine *ginext.Engine,
	authHandler *handler.AuthHandler,
	itemHandler *handler.ItemHandler,
	historyHandler *handler.HistoryHandler,
	jwtManager *jwt.Manager,
) {
	auth := engine.Group("/api/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
	}

	engine.Static("/static", "./web/static")
	engine.LoadHTMLGlob("web/templates/*")

	engine.GET("/login", func(c *ginext.Context) {
		c.HTML(200, "login.html", nil)
	})

	engine.GET("/register", func(c *ginext.Context) {
		c.HTML(200, "register.html", nil)
	})

	api := engine.Group("/api")
	api.Use(middleware.AuthMiddleware(jwtManager))
	{
		items := api.Group("/items")
		{
			items.GET("", itemHandler.GetAll)
			items.GET("/:id", itemHandler.GetByID)
			items.POST("", middleware.RequireCreatePermission(), itemHandler.Create)
			items.PUT("/:id", middleware.RequireUpdatePermission(), itemHandler.Update)
			items.DELETE("/:id", middleware.RequireDeletePermission(), itemHandler.Delete)
		}

		history := api.Group("/history")
		{
			history.GET("", historyHandler.GetAll)
			history.GET("/items/:id", historyHandler.GetByItemID)
		}
	}

	engine.GET("/", middleware.AuthPageMiddleware(jwtManager), func(c *ginext.Context) {
		user, _ := c.Get("user")
		u := user.(*entity.User)

		c.HTML(200, "app.html", gin.H{
			"username": u.Username,
			"role":     u.Role,
		})
	})

	engine.GET("/logout", func(c *ginext.Context) {
		c.SetCookie("token", "", -1, "/", "", false, true)
		c.Redirect(302, "/login")
	})

}
