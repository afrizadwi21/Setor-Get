package handlers

import (
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type CheckEmailRequest struct {
	Emails []string `json:"emails"`
	Raw    string   `json:"raw"` // optional newline separated string
}

type CheckEmailResult struct {
	Email   string `json:"email"`
	Status  string `json:"status"` // "ok" (Aktif), "bad" (Tidak valid), "warn" (Tidak aktif)
	Message string `json:"message"`
}

var checkerRegex = regexp.MustCompile(`^get[^@\s]*@gmail\.com$`)

func CheckEmails(c *fiber.Ctx) error {
	var req CheckEmailRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var list []string
	if len(req.Emails) > 0 {
		list = req.Emails
	} else if req.Raw != "" {
		for _, line := range strings.Split(req.Raw, "\n") {
			t := strings.TrimSpace(line)
			if t != "" {
				list = append(list, t)
			}
		}
	}

	// Limit to 20 emails max
	if len(list) > 20 {
		list = list[:20]
	}

	if len(list) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Silakan masukkan setidaknya satu alamat email",
		})
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	var results []CheckEmailResult

	for _, rawEmail := range list {
		e := strings.ToLower(strings.TrimSpace(rawEmail))
		if !checkerRegex.MatchString(e) {
			results = append(results, CheckEmailResult{
				Email:   e,
				Status:  "bad",
				Message: "Format tidak valid (harus diawali 'get' & akhiran @gmail.com)",
			})
		} else {
			// Check simulation: active if random > 0.35
			if rng.Float64() > 0.35 {
				results = append(results, CheckEmailResult{
					Email:   e,
					Status:  "ok",
					Message: "Akun aktif",
				})
			} else {
				results = append(results, CheckEmailResult{
					Email:   e,
					Status:  "warn",
					Message: "Akun tidak aktif",
				})
			}
		}
	}

	return c.JSON(fiber.Map{
		"total":   len(results),
		"results": results,
	})
}
