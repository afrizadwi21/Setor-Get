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

	amount := req.Amount
	if amount <= 0 {
		amount = user.Balance
	}

	const minWithdrawal = 25000
	if user.Balance < minWithdrawal || amount < minWithdrawal {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Saldo minimal Rp25.000 untuk melakukan penarikan.",
		})
	}

	if amount > user.Balance {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Jumlah penarikan melebihi saldo yang dimiliki.",
		})
	}

	// Deduct balance and update TotalWD
	user.Balance -= amount
	user.TotalWD += amount
	if err := database.DB.Save(user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal memproses saldo penarikan",
		})
	}

	wd := models.Withdrawal{
		UserID:        user.ID,
		Method:        req.Method,
		AccountNumber: req.AccountNumber,
		Amount:        amount,
		Status:        models.WithdrawalPending,
	}
	database.DB.Create(&wd)

	database.DB.Create(&models.Notification{
		UserID:  user.ID,
		Title:   "Penarikan Diajukan",
		Message: fmt.Sprintf("Penarikan Rp%s diajukan ke %s (%s).", formatIDR(amount), req.Method, req.AccountNumber),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Penarikan berhasil diajukan",
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
