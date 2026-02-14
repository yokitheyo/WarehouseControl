package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/wb-go/wbf/ginext"
	"github.com/yokitheyo/WarehouseControl/internal/domain/entity"
	"github.com/yokitheyo/WarehouseControl/internal/pkg/response"
	"github.com/yokitheyo/WarehouseControl/internal/usecase"
)

type HistoryHandler struct {
	historyUseCase *usecase.HistoryUseCase
}

func NewHistoryHandler(historyUseCase *usecase.HistoryUseCase) *HistoryHandler {
	return &HistoryHandler{
		historyUseCase: historyUseCase,
	}
}

func (h *HistoryHandler) GetByItemID(c *ginext.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid item id")
		return
	}

	history, err := h.historyUseCase.GetByItemID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, entity.ErrItemNotFound) {
			response.Error(c, http.StatusNotFound, "item not found")
			return
		}
		response.Error(c, http.StatusInternalServerError, "failed to get history")
		return
	}

	response.Success(c, http.StatusOK, history)
}

func (h *HistoryHandler) GetAll(c *ginext.Context) {
	filter := &entity.HistoryFilter{
		Limit: 100,
	}

	if itemIDStr := c.Query("item_id"); itemIDStr != "" {
		itemID, err := strconv.Atoi(itemIDStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "invalid item_id")
			return
		}
		filter.ItemID = &itemID
	}

	if username := c.Query("username"); username != "" {
		filter.Username = &username
	}

	if actionStr := c.Query("action"); actionStr != "" {
		action := entity.HistoryAction(actionStr)
		filter.Action = &action
	}

	if dateFromStr := c.Query("date_from"); dateFromStr != "" {
		dateFrom, err := time.Parse(time.RFC3339, dateFromStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "invalid date_from, expected RFC3339")
			return
		}
		filter.DateFrom = &dateFrom
	}

	if dateToStr := c.Query("date_to"); dateToStr != "" {
		dateTo, err := time.Parse(time.RFC3339, dateToStr)
		if err != nil {
			response.Error(c, http.StatusBadRequest, "invalid date_to, expected RFC3339")
			return
		}
		filter.DateTo = &dateTo
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			response.Error(c, http.StatusBadRequest, "invalid limit")
			return
		}
		filter.Limit = limit
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			response.Error(c, http.StatusBadRequest, "invalid offset")
			return
		}
		filter.Offset = offset
	}

	if err := validateHistoryFilter(filter); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	history, err := h.historyUseCase.GetAll(c.Request.Context(), filter)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to get history")
		return
	}

	response.Success(c, http.StatusOK, history)
}

func validateHistoryFilter(filter *entity.HistoryFilter) error {
	if filter.DateFrom != nil && filter.DateTo != nil {
		if filter.DateFrom.After(*filter.DateTo) {
			return errors.New("date_from must be before date_to")
		}
	}
	return nil
}
