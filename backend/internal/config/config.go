package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort     string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBSSLMode   string
	DBTimeZone  string
	FrontendURL string
	JWTSecret   string
}

func LoadConfig() *Config {
	loaded := false
	for _, p := range []string{".env", "backend/.env", "../.env"} {
		if err := godotenv.Load(p); err == nil {
			log.Printf("Loaded environment from %s\n", p)
			loaded = true
			break
		}
	}
	if !loaded {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		AppPort:     getEnv("APP_PORT", "8080"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", "postgres"),
		DBName:      getEnv("DB_NAME", "setorget_db"),
		DBSSLMode:   getEnv("DB_SSLMODE", "disable"),
		DBTimeZone:  getEnv("DB_TIMEZONE", "Asia/Jakarta"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
		JWTSecret:   getEnv("JWT_SECRET", "setor-gmail-super-secret-key-123456"),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
