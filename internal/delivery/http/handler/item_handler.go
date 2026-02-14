package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/wb-go/wbf/ginext"
	"github.com/yokitheyo/WarehouseControl/internal/delivery/http/middleware"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/response"
	"github.com/yokitheyo/WarehouseControl/internal/usecase"
)

type ItemHandler struct {
	itemUseCase *usecase.ItemUseCase
}

func NewItemHandler(itemUseCase *usecase.ItemUseCase) *ItemHandler {
	return &ItemHandler{
		itemUseCase: itemUseCase,
	}
}

type createItemRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity" binding:"required,min=0"`
	Price       float64 `json:"price" binding:"required,min=0"`
}

func (h *ItemHandler) Create(c *ginext.Context) {
	var req createItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, entity.ErrUnauthorized.Error())
		return
	}

	item := &entity.Item{
		Name:        req.Name,
		Description: req.Description,
		Quantity:    req.Quantity,
		Price:       req.Price,
	}

	if err := h.itemUseCase.Create(c.Request.Context(), item, user.Username); err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create item")
		return
	}

	response.Success(c, http.StatusCreated, item)
}

func (h *ItemHandler) GetAll(c *ginext.Context) {
	items, err := h.itemUseCase.GetAll(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to get items")
		return
	}

	response.Success(c, http.StatusOK, items)
}

func (h *ItemHandler) GetByID(c *ginext.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid item id")
		return
	}

	item, err := h.itemUseCase.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, entity.ErrItemNotFound) {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "failed to get item")
		return
	}

	response.Success(c, http.StatusOK, item)
}

type updateItemRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity" binding:"required,min=0"`
	Price       float64 `json:"price" binding:"required,min=0"`
}

func (h *ItemHandler) Update(c *ginext.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid item id")
		return
	}

	var req updateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, entity.ErrUnauthorized.Error())
		return
	}

	item := &entity.Item{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
		Quantity:    req.Quantity,
		Price:       req.Price,
	}

	if err := h.itemUseCase.Update(c.Request.Context(), item, user.Username); err != nil {
		if errors.Is(err, entity.ErrItemNotFound) {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "failed to update item")
		return
	}

	response.Success(c, http.StatusOK, item)
}

func (h *ItemHandler) Delete(c *ginext.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid item id")
		return
	}

	user, err := middleware.GetUserFromContext(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, entity.ErrUnauthorized.Error())
		return
	}

	if err := h.itemUseCase.Delete(c.Request.Context(), id, user.Username); err != nil {
		if errors.Is(err, entity.ErrItemNotFound) {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}
		response.Error(c, http.StatusInternalServerError, "failed to delete item")
		return
	}

	response.Success(c, http.StatusOK, ginext.H{"message": "item deleted successfully"})
}
