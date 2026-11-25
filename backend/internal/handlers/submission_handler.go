package handlers

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

var emailRegex = regexp.MustCompile(`^get[a-z0-9.]{3,27}@gmail\.com$`)

type SubmitGmailRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func SubmitGmail(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req SubmitGmailRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid input format",
		})
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	pass := strings.TrimSpace(req.Password)

	// Check T&C
	if !user.AgreedTNC {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Baca dan setujui Syarat & Ketentuan dulu.",
		})
	}

	// Check daily limit
	startOfDay := time.Now().Truncate(24 * time.Hour)
	var todayCount int64
	database.DB.Model(&models.Submission{}).Where("user_id = ? AND created_at >= ?", user.ID, startOfDay).Count(&todayCount)
	limit := user.DailyLimit
	if limit <= 0 {
		limit = 20
	}
	if int(todayCount) >= limit {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Batas setor hari ini sudah habis.",
		})
	}

	// Check format rules
	if !emailRegex.MatchString(email) || len(pass) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email harus diawali “get” dan berakhiran @gmail.com, kata sandi min. 8 karakter.",
		})
	}

	// Check if already submitted
	var existing models.Submission
	if err := database.DB.Where("LOWER(email) = ?", email).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email sudah pernah disetor sebelumnya.",
		})
	}

	submission := models.Submission{
		UserID:       user.ID,
		Email:        email,
		EmailPass:    pass,
		Status:       models.StatusPending,
		RewardAmount: 2500,
	}

	if err := database.DB.Create(&submission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal menyimpan setoran",
		})
	}

	// Create submission notification
	database.DB.Create(&models.Notification{
		UserID:  user.ID,
		Title:   "Setor Gmail",
		Message: email + " diterima untuk dicek admin.",
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": email + " berhasil disetor dan menunggu pengecekan admin.",
		"data":    submission,
	})
}

func checkReferralMilestone(referredUserID uint) {
	var ref models.Referral
	if err := database.DB.Where("referred_user_id = ? AND is_successful = false", referredUserID).First(&ref).Error; err == nil {
		ref.IsSuccessful = true
		database.DB.Save(&ref)

		var referrer models.User
		if err := database.DB.First(&referrer, ref.ReferrerID).Error; err == nil {
			var referredUser models.User
			database.DB.First(&referredUser, referredUserID)

			database.DB.Create(&models.Notification{
				UserID:  referrer.ID,
				Title:   "Referral Berhasil",
				Message: fmt.Sprintf("Stor pertama %s diterima. Referral berhasil.", referredUser.Username),
			})

			// Check total successful referrals for the referrer (milestone 20 teman -> bonus 15000)
			var successCount int64
			database.DB.Model(&models.Referral{}).Where("referrer_id = ? AND is_successful = true", referrer.ID).Count(&successCount)
			if successCount == 20 {
				bonusAmount := int64(15000)
				database.DB.Model(&models.User{}).Where("id = ?", referrer.ID).Update("balance", database.DB.Raw("balance + ?", bonusAmount))
				database.DB.Create(&models.ReferralBonus{
					UserID: referrer.ID,
					Title:  "Bonus misi 20 teman",
					Amount: bonusAmount,
				})
				database.DB.Create(&models.Notification{
					UserID:  referrer.ID,
					Title:   "Misi Referral Selesai",
					Message: "Misi selesai! Bonus Rp15.000 masuk ke saldo.",
				})
			}
		}
	}
}

func GetSubmissions(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var items []models.Submission
	if err := database.DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil riwayat setoran",
		})
	}

	return c.JSON(fiber.Map{
		"data": items,
	})
}
