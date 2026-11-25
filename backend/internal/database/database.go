package database

import (
	"fmt"
	"log"

	"backend/internal/config"
	"backend/internal/models"

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

	// Auto-migrate models for Setor Gmail application
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
	return db, nil
}
