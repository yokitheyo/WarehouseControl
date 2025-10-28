package handler

import (
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
		response.Error(c, 400, "invalid item id")
		return
	}

	history, err := h.historyUseCase.GetByItemID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, 500, "failed to get history")
		return
	}

	response.Success(c, 200, history)
}

func (h *HistoryHandler) GetAll(c *ginext.Context) {
	filter := &entity.HistoryFilter{}

	if itemIDStr := c.Query("item_id"); itemIDStr != "" {
		itemID, err := strconv.Atoi(itemIDStr)
		if err == nil {
			filter.ItemID = &itemID
		}
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
		if err == nil {
			filter.DateFrom = &dateFrom
		}
	}

	if dateToStr := c.Query("date_to"); dateToStr != "" {
		dateTo, err := time.Parse(time.RFC3339, dateToStr)
		if err == nil {
			filter.DateTo = &dateTo
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err == nil && limit > 0 {
			filter.Limit = limit
		}
	} else {
		filter.Limit = 100
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		if err == nil && offset >= 0 {
			filter.Offset = offset
		}
	}

	history, err := h.historyUseCase.GetAll(c.Request.Context(), filter)
	if err != nil {
		response.Error(c, 500, "failed to get history")
		return
	}

	response.Success(c, 200, history)
}
