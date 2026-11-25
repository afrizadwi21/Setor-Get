package database

import (
	"fmt"
	"log"
	"strings"

	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/utils"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
		cfg.DBSSLMode,
		cfg.DBTimeZone,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database")

	// Auto-migrate models for StorGet application
	err = db.AutoMigrate(
		&models.User{},
		&models.Submission{},
		&models.Withdrawal{},
		&models.Referral{},
		&models.ReferralBonus{},
		&models.Notification{},
		&models.ChatMessage{},
	)
	if err != nil {
		log.Printf("Warning: auto-migration error: %v\n", err)
	}

	DB = db
	seedAdmin(db)
	return db, nil
}

func seedAdmin(db *gorm.DB) {
	const adminEmail = "afriza.dwi21@gmail.com"
	const adminUsername = "Afriza"
	const adminPassword = "DWIGANTENG03"

	hash, err := utils.HashPassword(adminPassword)
	if err != nil {
		log.Printf("Warning: failed to hash admin password: %v\n", err)
		return
	}

	var admin models.User
	err = db.Where("LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)", adminEmail, adminEmail).First(&admin).Error
	if err != nil {
		admin = models.User{
			Email:        adminEmail,
			Username:     adminUsername,
			FullName:     "Afriza Dwi",
			PasswordHash: hash,
			Role:         "admin",
			AgreedTNC:    true,
			DailyLimit:   100,
			ReferralCode: strings.ToUpper(utils.GenerateRandomCode(8)),
		}
		if createErr := db.Create(&admin).Error; createErr != nil {
			log.Printf("Warning: failed to seed admin user: %v\n", createErr)
			return
		}
		log.Printf("Seeded admin account: %s (username: %s)\n", adminEmail, adminUsername)
		return
	}

	// Ensure existing admin has proper email, display username "Afriza", role "admin", and agreed TNC
	updated := false
	if admin.Email != adminEmail {
		admin.Email = adminEmail
		updated = true
	}
	if admin.Username == adminEmail || admin.Username == "" {
		admin.Username = adminUsername
		updated = true
	}
	if admin.Role != "admin" || !admin.AgreedTNC {
		admin.Role = "admin"
		admin.AgreedTNC = true
		updated = true
	}
	if updated {
		db.Save(&admin)
	}
}
