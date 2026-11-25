package handlers

import (
	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type LeaderboardRow struct {
	Rank          int    `json:"rank"`
	Username      string `json:"username"`
	TotalWD       int64  `json:"total_wd"`
	WDCount       int64  `json:"wd_count"`
	AcceptedCount int64  `json:"accepted_count"`
	IsMe          bool   `json:"is_me"`
}

func GetLeaderboard(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	type Result struct {
		UserID        uint   `json:"user_id"`
		Username      string `json:"username"`
		TotalWD       int64  `json:"total_wd"`
		WDCount       int64  `json:"wd_count"`
		AcceptedCount int64  `json:"accepted_count"`
	}

	var results []Result
	// Realtime leaderboard ranked by largest total withdrawal (total_wd DESC) from PostgreSQL
	database.DB.Table("users").
		Select(`users.id as user_id, users.username as username, users.total_wd as total_wd,
			(SELECT COUNT(*) FROM withdrawals w WHERE w.user_id = users.id AND w.status = 'approved') as wd_count,
			(SELECT COUNT(*) FROM submissions s WHERE s.user_id = users.id AND s.status = 'ok' AND s.deleted_at IS NULL) as accepted_count`).
		Where("users.deleted_at IS NULL AND users.role <> ?", "admin").
		Order("users.total_wd desc, wd_count desc, accepted_count desc, users.id asc").
		Limit(20).
		Scan(&results)

	rows := make([]LeaderboardRow, 0, len(results))
	for i, r := range results {
		rows = append(rows, LeaderboardRow{
			Rank:          i + 1,
			Username:      r.Username,
			TotalWD:       r.TotalWD,
			WDCount:       r.WDCount,
			AcceptedCount: r.AcceptedCount,
			IsMe:          r.UserID == user.ID,
		})
	}

	return c.JSON(fiber.Map{
		"leaderboard": rows,
	})
}
