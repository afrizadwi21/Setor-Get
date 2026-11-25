package handlers

import (
	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func GetNotifications(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var notifs []models.Notification
	database.DB.Where("user_id = ?", user.ID).Order("created_at desc").Limit(30).Find(&notifs)

	return c.JSON(fiber.Map{
		"notifications": notifs,
	})
}

func MarkNotificationsRead(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	database.DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = false", user.ID).Update("is_read", true)

	return c.JSON(fiber.Map{
		"message": "Semua notifikasi ditandai sudah dibaca",
	})
}
