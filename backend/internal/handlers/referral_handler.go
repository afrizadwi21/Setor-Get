package handlers

import (
	"fmt"
	"math"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type ReferredUserItem struct {
	Username     string `json:"username"`
	IsSuccessful bool   `json:"is_successful"`
}

func GetReferralInfo(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var referrals []models.Referral
	database.DB.Preload("ReferredUser").Where("referrer_id = ?", user.ID).Order("created_at desc").Find(&referrals)

	var totalInvited = len(referrals)
	var successfulCount = 0
	var list []ReferredUserItem

	for _, ref := range referrals {
		uname := "Teman"
		if ref.ReferredUser != nil {
			uname = ref.ReferredUser.Username
		}
		if ref.IsSuccessful {
			successfulCount++
		}
		list = append(list, ReferredUserItem{
			Username:     uname,
			IsSuccessful: ref.IsSuccessful,
		})
	}

	var bonuses []models.ReferralBonus
	database.DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&bonuses)

	var totalBonus int64 = 0
	for _, b := range bonuses {
		totalBonus += b.Amount
	}

	percent := math.Min(100.0, float64(successfulCount)/20.0*100.0)

	return c.JSON(fiber.Map{
		"code":             user.ReferralCode,
		"invite_link":      fmt.Sprintf("https://situsmu.com/daftar?ref=%s", user.ReferralCode),
		"total_invited":    totalInvited,
		"successful_count": successfulCount,
		"remaining_target": int(math.Max(0, float64(20-successfulCount))),
		"target":           20,
		"target_bonus":     15000,
		"progress_percent": int(percent),
		"total_bonus":      totalBonus,
		"referred_users":   list,
		"bonus_history":    bonuses,
	})
}
