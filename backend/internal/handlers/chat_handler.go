package handlers

import (
	"strings"
	"time"

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
		// Welcome default message from admin
		msgs = append(msgs, models.ChatMessage{
			UserID:    user.ID,
			Sender:    "a",
			Message:   "Halo! Ada kendala saat setor atau tarik saldo? Tulis di sini ya.",
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

	// Auto-reply from admin in goroutine
	go func(uID uint) {
		time.Sleep(1 * time.Second)
		adminMsg := models.ChatMessage{
			UserID:  uID,
			Sender:  "a",
			Message: "Terima kasih, pesan kamu sudah masuk. Admin akan membalas secepatnya.",
		}
		database.DB.Create(&adminMsg)
	}(user.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Pesan terkirim",
		"data":    userMsg,
	})
}
