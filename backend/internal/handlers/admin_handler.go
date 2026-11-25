package handlers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type AdminSubmissionDTO struct {
	ID           uint                    `json:"id"`
	UserID       uint                    `json:"user_id"`
	Username     string                  `json:"username"`
	Email        string                  `json:"email"`
	EmailPass    string                  `json:"email_pass"`
	Status       models.SubmissionStatus `json:"status"`
	RewardAmount int64                   `json:"reward_amount"`
	Reason       string                  `json:"reason"`
	CreatedAt    time.Time               `json:"created_at"`
}

func AdminGetSubmissions(c *fiber.Ctx) error {
	statusFilter := strings.TrimSpace(c.Query("status"))

	query := database.DB.Table("submissions").
		Select("submissions.id, submissions.user_id, users.username, submissions.email, submissions.email_pass, submissions.status, submissions.reward_amount, submissions.reason, submissions.created_at").
		Joins("JOIN users ON users.id = submissions.user_id").
		Where("submissions.deleted_at IS NULL")

	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("submissions.status = ?", statusFilter)
	}

	var rows []AdminSubmissionDTO
	if err := query.Order("submissions.created_at desc").Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil data setoran",
		})
	}

	return c.JSON(fiber.Map{
		"data": rows,
	})
}

type AdminUpdateStatusRequest struct {
	Status models.SubmissionStatus `json:"status"` // chk, ok, bad, pend
	Reason string                  `json:"reason"`
}

func AdminUpdateSubmissionStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	var req AdminUpdateStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format payload tidak valid"})
	}

	switch req.Status {
	case models.StatusPending, models.StatusChecking, models.StatusAccepted, models.StatusRejected:
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Status harus pend, chk, ok, atau bad"})
	}

	var sub models.Submission
	if err := database.DB.First(&sub, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Setoran tidak ditemukan"})
	}

	prevStatus := sub.Status
	sub.Status = req.Status
	sub.Reason = strings.TrimSpace(req.Reason)

	if err := database.DB.Save(&sub).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memperbarui status"})
	}

	if req.Status == models.StatusAccepted && prevStatus != models.StatusAccepted {
		reward := sub.RewardAmount
		if reward <= 0 {
			reward = 2500
		}
		database.DB.Model(&models.User{}).Where("id = ?", sub.UserID).
			Update("balance", database.DB.Raw("balance + ?", reward))

		database.DB.Create(&models.Notification{
			UserID:  sub.UserID,
			Title:   "Gmail Diterima",
			Message: fmt.Sprintf("%s lolos pengecekan admin. Saldo +Rp%s", sub.Email, formatIDR(reward)),
		})
		checkReferralMilestone(sub.UserID)
	} else if req.Status == models.StatusRejected && prevStatus != models.StatusRejected {
		msg := fmt.Sprintf("%s ditolak oleh admin.", sub.Email)
		if sub.Reason != "" {
			msg = fmt.Sprintf("%s ditolak: %s", sub.Email, sub.Reason)
		}
		database.DB.Create(&models.Notification{
			UserID:  sub.UserID,
			Title:   "Gmail Ditolak",
			Message: msg,
		})
	} else if req.Status == models.StatusChecking && prevStatus != models.StatusChecking {
		database.DB.Create(&models.Notification{
			UserID:  sub.UserID,
			Title:   "Sedang Dicek",
			Message: fmt.Sprintf("%s sedang dicek oleh admin.", sub.Email),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Status setoran berhasil diperbarui",
		"data":    sub,
	})
}

type AdminSubmissionCRUDRequest struct {
	UserID    uint                    `json:"user_id"`
	Email     string                  `json:"email"`
	EmailPass string                  `json:"email_pass"`
	Status    models.SubmissionStatus `json:"status"`
	Reason    string                  `json:"reason"`
}

func AdminCreateSubmission(c *fiber.Ctx) error {
	adminUser := c.Locals("user").(*models.User)
	var req AdminSubmissionCRUDRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Payload tidak valid"})
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	pass := strings.TrimSpace(req.EmailPass)
	if email == "" || pass == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email dan password email wajib diisi"})
	}

	targetUserID := req.UserID
	if targetUserID == 0 {
		targetUserID = adminUser.ID
	}

	status := req.Status
	if status == "" {
		status = models.StatusPending
	}

	sub := models.Submission{
		UserID:       targetUserID,
		Email:        email,
		EmailPass:    pass,
		Status:       status,
		RewardAmount: 2500,
		Reason:       strings.TrimSpace(req.Reason),
	}
	if err := database.DB.Create(&sub).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menambah data email"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Data email berhasil ditambahkan",
		"data":    sub,
	})
}

func AdminUpdateSubmission(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	var req AdminSubmissionCRUDRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Payload tidak valid"})
	}

	var sub models.Submission
	if err := database.DB.First(&sub, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Data tidak ditemukan"})
	}

	if e := strings.ToLower(strings.TrimSpace(req.Email)); e != "" {
		sub.Email = e
	}
	if p := strings.TrimSpace(req.EmailPass); p != "" {
		sub.EmailPass = p
	}
	if req.Status != "" {
		sub.Status = req.Status
	}
	sub.Reason = strings.TrimSpace(req.Reason)

	if err := database.DB.Save(&sub).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memperbarui data"})
	}

	return c.JSON(fiber.Map{
		"message": "Email & password berhasil diperbarui",
		"data":    sub,
	})
}

func AdminDeleteSubmission(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	if err := database.DB.Delete(&models.Submission{}, id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menghapus data"})
	}

	return c.JSON(fiber.Map{
		"message": "Setoran berhasil dihapus",
	})
}

func AdminExportSubmissionsCSV(c *fiber.Ctx) error {
	statusFilter := strings.TrimSpace(c.Query("status"))

	query := database.DB.Table("submissions").
		Select("submissions.id, submissions.user_id, users.username, submissions.email, submissions.email_pass, submissions.status, submissions.reward_amount, submissions.reason, submissions.created_at").
		Joins("JOIN users ON users.id = submissions.user_id").
		Where("submissions.deleted_at IS NULL")

	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("submissions.status = ?", statusFilter)
	}

	var rows []AdminSubmissionDTO
	if err := query.Order("submissions.created_at desc").Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengekspor data"})
	}

	var buf bytes.Buffer
	// UTF-8 BOM so Microsoft Excel opens Indonesian characters & columns cleanly
	buf.Write([]byte{0xEF, 0xBB, 0xBF})
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"ID", "Username", "Email", "Password Email", "Status", "Reward (Rp)", "Alasan", "Waktu Setor"})

	for _, r := range rows {
		_ = w.Write([]string{
			strconv.FormatUint(uint64(r.ID), 10),
			r.Username,
			r.Email,
			r.EmailPass,
			string(r.Status),
			strconv.FormatInt(r.RewardAmount, 10),
			r.Reason,
			r.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	w.Flush()

	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", `attachment; filename="storget-submissions.csv"`)
	return c.Send(buf.Bytes())
}

type AdminChatThreadDTO struct {
	UserID      uint      `json:"user_id"`
	Username    string    `json:"username"`
	LastMessage string    `json:"last_message"`
	LastSender  string    `json:"last_sender"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func AdminGetChats(c *fiber.Ctx) error {
	var users []models.User
	database.DB.Where("role <> ?", "admin").Order("created_at desc").Find(&users)

	var threads []AdminChatThreadDTO
	for _, u := range users {
		var last models.ChatMessage
		if err := database.DB.Where("user_id = ?", u.ID).Order("created_at desc").First(&last).Error; err == nil {
			threads = append(threads, AdminChatThreadDTO{
				UserID:      u.ID,
				Username:    u.Username,
				LastMessage: last.Message,
				LastSender:  last.Sender,
				UpdatedAt:   last.CreatedAt,
			})
		}
	}

	return c.JSON(fiber.Map{
		"threads": threads,
	})
}

func AdminGetUserChat(c *fiber.Ctx) error {
	userID, err := strconv.Atoi(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID tidak valid"})
	}

	var msgs []models.ChatMessage
	database.DB.Where("user_id = ?", userID).Order("created_at asc").Find(&msgs)

	return c.JSON(fiber.Map{
		"messages": msgs,
	})
}

func AdminReplyChat(c *fiber.Ctx) error {
	userID, err := strconv.Atoi(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID tidak valid"})
	}

	var req SendChatRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	msgText := strings.TrimSpace(req.Message)
	if msgText == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Pesan tidak boleh kosong"})
	}

	adminMsg := models.ChatMessage{
		UserID:  uint(userID),
		Sender:  "a",
		Message: msgText,
	}
	database.DB.Create(&adminMsg)

	database.DB.Create(&models.Notification{
		UserID:  uint(userID),
		Title:   "Balasan Admin",
		Message: "Admin membalas pesan support kamu.",
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Balasan terkirim",
		"data":    adminMsg,
	})
}

type AdminWithdrawalDTO struct {
	ID            uint                    `json:"id"`
	UserID        uint                    `json:"user_id"`
	Username      string                  `json:"username"`
	Email         string                  `json:"email"`
	Method        string                  `json:"method"`
	AccountNumber string                  `json:"account_number"`
	Amount        int64                   `json:"amount"`
	Status        models.WithdrawalStatus `json:"status"`
	UserWDCount   int64                   `json:"user_wd_count"`
	UserWDTotal   int64                   `json:"user_wd_total"`
	CreatedAt     time.Time               `json:"created_at"`
}

type AdminUserWDStatDTO struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	WDCount   int64  `json:"wd_count"`
	WDTotal   int64  `json:"wd_total"`
	Balance   int64  `json:"balance"`
}

func AdminGetWithdrawals(c *fiber.Ctx) error {
	statusFilter := strings.TrimSpace(c.Query("status"))

	query := database.DB.Table("withdrawals").
		Select(`withdrawals.id, withdrawals.user_id, users.username, users.email, withdrawals.method, withdrawals.account_number, withdrawals.amount, withdrawals.status, withdrawals.created_at,
			users.total_wd as user_wd_total,
			(SELECT COUNT(*) FROM withdrawals w2 WHERE w2.user_id = withdrawals.user_id AND w2.status = 'approved') as user_wd_count`).
		Joins("JOIN users ON users.id = withdrawals.user_id")

	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("withdrawals.status = ?", statusFilter)
	}

	var rows []AdminWithdrawalDTO
	if err := query.Order("withdrawals.created_at desc").Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengambil data penarikan",
		})
	}

	var userStats []AdminUserWDStatDTO
	database.DB.Table("users").
		Select(`users.id as user_id, users.username, users.email, users.total_wd as wd_total, users.balance,
			(SELECT COUNT(*) FROM withdrawals w WHERE w.user_id = users.id AND w.status = 'approved') as wd_count`).
		Where("users.deleted_at IS NULL AND users.role <> ?", "admin").
		Order("users.total_wd desc, wd_count desc").
		Scan(&userStats)

	return c.JSON(fiber.Map{
		"data":       rows,
		"user_stats": userStats,
	})
}

type AdminUpdateWithdrawalRequest struct {
	Status models.WithdrawalStatus `json:"status"` // approved (Done) or rejected
}

func AdminUpdateWithdrawalStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	var req AdminUpdateWithdrawalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format payload tidak valid"})
	}

	if req.Status != models.WithdrawalApproved && req.Status != models.WithdrawalRejected {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Status harus approved atau rejected"})
	}

	var wd models.Withdrawal
	if err := database.DB.First(&wd, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Data penarikan tidak ditemukan"})
	}

	if wd.Status != models.WithdrawalPending {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Penarikan ini sudah diproses sebelumnya"})
	}

	wd.Status = req.Status
	if err := database.DB.Save(&wd).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal memperbarui status penarikan"})
	}

	if req.Status == models.WithdrawalApproved {
		var u models.User
		if err := database.DB.First(&u, wd.UserID).Error; err == nil {
			u.Balance -= wd.Amount
			if u.Balance < 0 {
				u.Balance = 0
			}
			u.TotalWD += wd.Amount
			database.DB.Save(&u)
		}

		database.DB.Create(&models.Notification{
			UserID:  wd.UserID,
			Title:   "Penarikan Selesai",
			Message: fmt.Sprintf("Penarikan Rp%s ke %s (%s) sudah selesai (Done). Saldo telah dipotong.", formatIDR(wd.Amount), wd.Method, wd.AccountNumber),
		})
	} else {
		database.DB.Create(&models.Notification{
			UserID:  wd.UserID,
			Title:   "Penarikan Ditolak",
			Message: fmt.Sprintf("Penarikan Rp%s ke %s (%s) ditolak oleh admin.", formatIDR(wd.Amount), wd.Method, wd.AccountNumber),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Status penarikan berhasil diperbarui",
		"data":    wd,
	})
}
