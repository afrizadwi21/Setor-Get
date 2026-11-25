package main

import (
	"log"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize database connection
	_, err := database.ConnectDB(cfg)
	if err != nil {
		log.Printf("Warning: Database connection failed: %v\n", err)
		log.Println("Backend will still run. Please ensure PostgreSQL is running.")
	}

	app := fiber.New(fiber.Config{
		AppName: "Setor-Get API",
	})

	// Middlewares
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.FrontendURL,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Setup Routes
	routes.SetupRoutes(app)

	log.Printf("Starting server on port %s...\n", cfg.AppPort)
	if err := app.Listen(":" + cfg.AppPort); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
