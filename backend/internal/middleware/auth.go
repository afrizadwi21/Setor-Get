package middleware

import (
	"strings"

	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func AuthRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Missing authorization token",
		})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid authorization header format (Bearer <token>)",
		})
	}

	claims, err := utils.ValidateToken(parts[1])
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized: " + err.Error(),
		})
	}

	if database.DB == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Database tidak tersedia",
		})
	}

	var user models.User
	if err := database.DB.First(&user, claims.UserID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not found or deleted",
		})
	}

	c.Locals("user", &user)
	return c.Next()
}

func AdminRequired(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(*models.User)
	if !ok || user == nil || user.Role != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Akses ditolak. Khusus Admin.",
		})
	}
	return c.Next()
}
