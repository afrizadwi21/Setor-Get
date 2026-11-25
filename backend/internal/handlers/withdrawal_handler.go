package handlers

import (
	"fmt"
	"strings"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

type WithdrawRequest struct {
	Method        string `json:"method"`         // DANA, OVO, GoPay, Bank
	AccountNumber string `json:"account_number"` // phone or bank account number
	Amount        int64  `json:"amount"`         // optional, defaults to entire balance if <= 0
}

func RequestWithdrawal(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req WithdrawRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Format request tidak valid",
		})
	}

	req.Method = strings.TrimSpace(req.Method)
	req.AccountNumber = strings.TrimSpace(req.AccountNumber)

	// Refresh user balance
	database.DB.First(user, user.ID)

	if req.Method == "" || req.AccountNumber == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Metode dan nomor tujuan penarikan wajib diisi.",
		})
	}

	// Check pending withdrawals so user cannot double-withdraw before admin marks Done
	var pendingTotal int64
	database.DB.Model(&models.Withdrawal{}).
		Where("user_id = ? AND status = ?", user.ID, models.WithdrawalPending).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&pendingTotal)

	availableBalance := user.Balance - pendingTotal
	amount := req.Amount
	if amount <= 0 {
		amount = availableBalance
	}

	const minWithdrawal = 5000
	if availableBalance < minWithdrawal || amount < minWithdrawal {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Saldo tersedia minimal Rp5.000 (atau masih ada penarikan pending).",
		})
	}

	if amount > availableBalance {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Jumlah penarikan melebihi saldo yang tersedia.",
		})
	}

	wd := models.Withdrawal{
		UserID:        user.ID,
		Method:        req.Method,
		AccountNumber: req.AccountNumber,
		Amount:        amount,
		Status:        models.WithdrawalPending,
	}
	if err := database.DB.Create(&wd).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengajukan penarikan",
		})
	}

	database.DB.Create(&models.Notification{
		UserID:  user.ID,
		Title:   "Penarikan Diajukan",
		Message: fmt.Sprintf("Penarikan Rp%s diajukan ke %s (%s). Menunggu proses admin.", formatIDR(amount), req.Method, req.AccountNumber),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Penarikan berhasil diajukan dan menunggu konfirmasi admin",
		"data":    wd,
		"balance": user.Balance,
	})
}

func GetWithdrawals(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	var list []models.Withdrawal
	database.DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&list)

	return c.JSON(fiber.Map{
		"data": list,
	})
}

func formatIDR(n int64) string {
	in := fmt.Sprintf("%d", n)
	var out []rune
	l := len(in)
	for i, c := range in {
		if i > 0 && (l-i)%3 == 0 {
			out = append(out, '.')
		}
		out = append(out, c)
	}
	return string(out)
}
