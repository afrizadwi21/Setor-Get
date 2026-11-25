package handlers

import (
	"strings"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type SendChatRequest struct {
	Message string `json:"message"`
}

func GetChatMessages(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var msgs []models.ChatMessage
	database.DB.Where("user_id = ?", user.ID).Order("created_at asc").Find(&msgs)

	if len(msgs) == 0 {
		msgs = append(msgs, models.ChatMessage{
			UserID:    user.ID,
			Sender:    "a",
			Message:   "Halo! Ada kendala saat setor atau tarik saldo? Tulis di sini ya, admin akan membalas.",
			CreatedAt: user.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"messages": msgs,
	})
}

func SendChatMessage(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req SendChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	msgText := strings.TrimSpace(req.Message)
	if msgText == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Pesan tidak boleh kosong"})
	}

	userMsg := models.ChatMessage{
		UserID:  user.ID,
		Sender:  "u",
		Message: msgText,
	}
	database.DB.Create(&userMsg)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Pesan terkirim ke admin",
		"data":    userMsg,
	})
}
