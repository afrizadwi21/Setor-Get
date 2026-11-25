package handlers

import (
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func GetDashboardSummary(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	// Refresh user balance from DB
	database.DB.First(user, user.ID)

	var okCount, pendCount, badCount, chkCount int64
	database.DB.Model(&models.Submission{}).Where("user_id = ? AND status = ?", user.ID, models.StatusAccepted).Count(&okCount)
	database.DB.Model(&models.Submission{}).Where("user_id = ? AND status = ?", user.ID, models.StatusPending).Count(&pendCount)
	database.DB.Model(&models.Submission{}).Where("user_id = ? AND status = ?", user.ID, models.StatusRejected).Count(&badCount)
	database.DB.Model(&models.Submission{}).Where("user_id = ? AND status = ?", user.ID, models.StatusChecking).Count(&chkCount)

	// Count today's submissions for daily limit
	startOfDay := time.Now().Truncate(24 * time.Hour)
	var todayCount int64
	database.DB.Model(&models.Submission{}).Where("user_id = ? AND created_at >= ?", user.ID, startOfDay).Count(&todayCount)

	limit := user.DailyLimit
	if limit <= 0 {
		limit = 20
	}
	remaining := limit - int(todayCount)
	if remaining < 0 {
		remaining = 0
	}

	// Unread notification count
	var unreadNotifs int64
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = false", user.ID).Count(&unreadNotifs)

	return c.JSON(fiber.Map{
		"balance":          user.Balance,
		"price_per_gmail":  2500,
		"limit":            limit,
		"today_count":      todayCount,
		"limit_remaining":  remaining,
		"unread_notifs":    unreadNotifs,
		"stats": fiber.Map{
			"ok":   okCount,
			"pend": pendCount,
			"bad":  badCount,
			"chk":  chkCount,
		},
		"user": user,
	})
}
