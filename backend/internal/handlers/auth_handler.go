package handlers

import (
	"strings"

	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
	RefCode  string `json:"ref_code"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type GoogleLoginRequest struct {
	Email  string `json:"email"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

func Register(c *fiber.Ctx) error {
	if database.DB == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Database tidak tersedia. Silakan coba lagi nanti.",
		})
	}

	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload format",
		})
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Username = strings.TrimSpace(req.Username)

	if req.Email == "" || !strings.Contains(req.Email, "@") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Masukkan alamat email yang valid",
		})
	}

	if len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Kata sandi minimal 6 karakter",
		})
	}

	// Derive clean username from email if not provided (never show full email as username)
	if req.Username == "" || strings.Contains(req.Username, "@") {
		localPart := strings.Split(req.Email, "@")[0]
		localPart = strings.Split(localPart, ".")[0]
		if len(localPart) < 3 {
			localPart = strings.Split(req.Email, "@")[0]
		}
		req.Username = strings.Title(strings.ToLower(localPart))
	}

	if len(req.Username) < 3 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username minimal 3 karakter",
		})
	}

	// Check if email already registered
	var existingEmail models.User
	if err := database.DB.Where("LOWER(email) = LOWER(?)", req.Email).First(&existingEmail).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Email sudah terdaftar. Silakan masuk.",
		})
	}

	// Ensure username uniqueness
	var existingUser models.User
	if err := database.DB.Where("LOWER(username) = LOWER(?)", req.Username).First(&existingUser).Error; err == nil {
		req.Username = req.Username + "_" + strings.ToLower(utils.GenerateRandomCode(3))
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal mengenkripsi kata sandi",
		})
	}

	user := models.User{
		Email:        req.Email,
		Username:     req.Username,
		FullName:     strings.TrimSpace(req.FullName),
		Phone:        strings.TrimSpace(req.Phone),
		PasswordHash: hash,
		ReferralCode: strings.ToUpper(utils.GenerateRandomCode(8)),
		DailyLimit:   20,
	}

	// Handle referral if provided
	if req.RefCode != "" {
		var referrer models.User
		if err := database.DB.Where("referral_code = ?", strings.ToUpper(req.RefCode)).First(&referrer).Error; err == nil {
			user.ReferredByID = &referrer.ID
		}
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membuat akun",
		})
	}

	// If registered via referral, record referral record
	if user.ReferredByID != nil {
		ref := models.Referral{
			ReferrerID:     *user.ReferredByID,
			ReferredUserID: user.ID,
			IsSuccessful:   false,
		}
		database.DB.Create(&ref)

		// Create welcome notification for referrer
		notif := models.Notification{
			UserID:  *user.ReferredByID,
			Title:   "Teman Baru Bergabung",
			Message: user.Username + " bergabung memakai kode referral kamu.",
		}
		database.DB.Create(&notif)
	}

	token, _ := utils.GenerateToken(user.ID, user.Username)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registrasi berhasil",
		"token":   token,
		"user":    user,
	})
}

func Login(c *fiber.Ctx) error {
	if database.DB == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Database tidak tersedia. Silakan coba lagi nanti.",
		})
	}

	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload format",
		})
	}

	identifier := strings.TrimSpace(req.Email)
	if identifier == "" {
		identifier = strings.TrimSpace(req.Username)
	}
	if identifier == "" || len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Isi email dan kata sandi (min. 6 karakter)",
		})
	}

	var user models.User
	if err := database.DB.Where("LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)", identifier, identifier).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Akun dengan email tersebut tidak ditemukan. Silakan daftar terlebih dahulu.",
		})
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Email atau kata sandi salah.",
		})
	}

	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membuat sesi login",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login berhasil",
		"token":   token,
		"user":    user,
	})
}

func GoogleLogin(c *fiber.Ctx) error {
	if database.DB == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Database tidak tersedia. Silakan coba lagi nanti.",
		})
	}

	var req GoogleLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid payload format",
		})
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || !strings.Contains(email, "@") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email Google tidak valid",
		})
	}

	username := strings.Split(email, "@")[0]
	if req.Name != "" {
		username = strings.ReplaceAll(strings.ToLower(strings.TrimSpace(req.Name)), " ", "_")
	}

	var user models.User
	if err := database.DB.Where("LOWER(username) = LOWER(?)", username).First(&user).Error; err != nil {
		randomPass, _ := utils.HashPassword(utils.GenerateRandomCode(16))
		user = models.User{
			Username:     username,
			PasswordHash: randomPass,
			Avatar:       req.Avatar,
			ReferralCode: strings.ToUpper(utils.GenerateRandomCode(8)),
			DailyLimit:   20,
		}
		if err := database.DB.Create(&user).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Gagal membuat akun Google",
			})
		}
	}

	token, err := utils.GenerateToken(user.ID, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Gagal membuat sesi login",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login Google berhasil",
		"token":   token,
		"user":    user,
	})
}

func GetMe(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	return c.JSON(fiber.Map{
		"user": user,
	})
}

type UpdateUsernameRequest struct {
	Username string `json:"username"`
}

func UpdateUsername(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req UpdateUsernameRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	req.Username = strings.TrimSpace(req.Username)
	if len(req.Username) < 3 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username minimal 3 karakter.",
		})
	}

	// Check if unique
	var existing models.User
	if err := database.DB.Where("LOWER(username) = LOWER(?) AND id <> ?", req.Username, user.ID).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username sudah digunakan",
		})
	}

	user.Username = req.Username
	database.DB.Save(user)

	// Add notification
	database.DB.Create(&models.Notification{
		UserID:  user.ID,
		Title:   "Ganti Username",
		Message: "Username diganti menjadi " + req.Username + ".",
	})

	return c.JSON(fiber.Map{
		"message": "Username berhasil diganti.",
		"user":    user,
	})
}

type ChangePasswordRequest struct {
	OldPassword     string `json:"old_password"`
	NewPassword     string `json:"new_password"`
	ConfirmPassword string `json:"confirm_password"`
}

func ChangePassword(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	if !utils.CheckPasswordHash(req.OldPassword, user.PasswordHash) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Kata sandi lama salah.",
		})
	}

	if len(req.NewPassword) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Kata sandi baru minimal 6 karakter.",
		})
	}

	if req.NewPassword != req.ConfirmPassword {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Konfirmasi kata sandi tidak sama.",
		})
	}

	hash, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal enkripsi password baru"})
	}

	user.PasswordHash = hash
	database.DB.Save(user)

	database.DB.Create(&models.Notification{
		UserID:  user.ID,
		Title:   "Ganti Kata Sandi",
		Message: "Kata sandi berhasil diganti.",
	})

	return c.JSON(fiber.Map{
		"message": "Kata sandi berhasil diganti.",
	})
}

type UpdateAvatarRequest struct {
	Avatar string `json:"avatar"`
}

func UpdateAvatar(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req UpdateAvatarRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	user.Avatar = req.Avatar
	database.DB.Save(user)

	return c.JSON(fiber.Map{
		"message": "Avatar berhasil diperbarui",
		"avatar":  user.Avatar,
	})
}

type UpdateProfileRequest struct {
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
}

func UpdateProfile(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid body"})
	}

	if e := strings.ToLower(strings.TrimSpace(req.Email)); e != "" {
		if !strings.Contains(e, "@") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format email tidak valid"})
		}
		var existing models.User
		if err := database.DB.Where("LOWER(email) = LOWER(?) AND id <> ?", e, user.ID).First(&existing).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah digunakan akun lain"})
		}
		user.Email = e
	}

	user.FullName = strings.TrimSpace(req.FullName)
	user.Phone = strings.TrimSpace(req.Phone)
	database.DB.Save(user)

	return c.JSON(fiber.Map{
		"message": "Info pribadi berhasil diperbarui.",
		"user":    user,
	})
}

func AgreeTNC(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	user.AgreedTNC = true
	database.DB.Save(user)

	database.DB.Create(&models.Notification{
		UserID:  user.ID,
		Title:   "Syarat & Ketentuan",
		Message: "Syarat & Ketentuan disetujui.",
	})

	return c.JSON(fiber.Map{
		"message": "Syarat & Ketentuan disetujui.",
	})
}
