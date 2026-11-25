package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v1")

	// Health Check
	api.Get("/health", handlers.HealthCheck)

	// Auth Public Routes
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// Checker (Public or Protected)
	api.Post("/checker", handlers.CheckEmails)

	// Protected Endpoints
	protected := api.Group("", middleware.AuthRequired)

	// Profile & User Settings
	protected.Get("/auth/me", handlers.GetMe)
	protected.Put("/auth/username", handlers.UpdateUsername)
	protected.Put("/auth/password", handlers.ChangePassword)
	protected.Put("/auth/avatar", handlers.UpdateAvatar)
	protected.Post("/auth/agree-tnc", handlers.AgreeTNC)

	// Dashboard
	protected.Get("/dashboard/summary", handlers.GetDashboardSummary)

	// Submissions (Setor Gmail & Riwayat)
	protected.Post("/submissions", handlers.SubmitGmail)
	protected.Get("/submissions", handlers.GetSubmissions)

	// Withdrawals (Tarik Saldo)
	protected.Post("/withdrawals", handlers.RequestWithdrawal)
	protected.Get("/withdrawals", handlers.GetWithdrawals)

	// Referral System
	protected.Get("/referrals", handlers.GetReferralInfo)

	// Leaderboard
	protected.Get("/leaderboard", handlers.GetLeaderboard)

	// Support Chat
	protected.Get("/chat", handlers.GetChatMessages)
	protected.Post("/chat", handlers.SendChatMessage)

	// Notifications
	protected.Get("/notifications", handlers.GetNotifications)
	protected.Put("/notifications/read-all", handlers.MarkNotificationsRead)
}
