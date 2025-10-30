package handler

import (
	"github.com/wb-go/wbf/ginext"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/response"
	"github.com/yokitheyo/WarehouseControl/internal/usecase"
)

type AuthHandler struct {
	authUseCase *usecase.AuthUseCase
}

func NewAuthHandler(authUseCase *usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
	}
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type loginResponse struct {
	Token    string      `json:"token"`
	Username string      `json:"username"`
	Role     entity.Role `json:"role"`
}

func (h *AuthHandler) Login(c *ginext.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "invalid request body")
		return
	}

	token, err := h.authUseCase.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		if err == entity.ErrInvalidCredentials {
			response.Error(c, 401, err.Error())
			return
		}
		response.Error(c, 500, "internal server error")
		return
	}

	user, err := h.authUseCase.GetUserInfo(c.Request.Context(), req.Username)
	if err != nil {
		response.Error(c, 500, "internal server error")
		return
	}

	response.Success(c, 200, loginResponse{
		Token:    token,
		Username: user.Username,
		Role:     user.Role,
	})
}

type registerRequest struct {
	Username string      `json:"username" binding:"required"`
	Password string      `json:"password" binding:"required,min=6"`
	Role     entity.Role `json:"role" binding:"required"`
}

func (h *AuthHandler) Register(c *ginext.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "invalid request body")
		return
	}

	if req.Role != entity.RoleAdmin && req.Role != entity.RoleManager && req.Role != entity.RoleViewer {
		response.Error(c, 400, "invalid role")
		return
	}

	err := h.authUseCase.Register(c.Request.Context(), req.Username, req.Password, req.Role)
	if err != nil {
		response.Error(c, 500, "failed to register user")
		return
	}

	response.Success(c, 201, ginext.H{"message": "user registered successfully"})
}
