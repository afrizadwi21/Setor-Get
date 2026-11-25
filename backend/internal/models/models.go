package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"size:100;uniqueIndex;not null" json:"username"`
	PasswordHash string         `gorm:"not null" json:"-"`
	Avatar       string         `gorm:"type:text" json:"avatar"`
	Balance      int64          `gorm:"default:0" json:"balance"`
	TotalWD      int64          `gorm:"default:0" json:"total_wd"`
	DailyLimit   int            `gorm:"default:20" json:"daily_limit"`
	ReferralCode string         `gorm:"size:20;uniqueIndex" json:"referral_code"`
	ReferredByID *uint          `json:"referred_by_id"`
	AgreedTNC    bool           `gorm:"default:false" json:"agreed_tnc"`
	Role         string         `gorm:"size:20;default:'user'" json:"role"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type SubmissionStatus string

const (
	StatusPending  SubmissionStatus = "pend"
	StatusChecking SubmissionStatus = "chk"
	StatusAccepted SubmissionStatus = "ok"
	StatusRejected SubmissionStatus = "bad"
)

type Submission struct {
	ID           uint             `gorm:"primaryKey" json:"id"`
	UserID       uint             `gorm:"index;not null" json:"user_id"`
	Email        string           `gorm:"size:255;index;not null" json:"email"`
	EmailPass    string           `gorm:"size:255;not null" json:"-"`
	Status       SubmissionStatus `gorm:"size:20;default:'pend'" json:"status"` // pend, chk, ok, bad
	RewardAmount int64            `gorm:"default:2500" json:"reward_amount"`
	Reason       string           `gorm:"size:255" json:"reason,omitempty"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	DeletedAt    gorm.DeletedAt   `gorm:"index" json:"-"`
}

type WithdrawalStatus string

const (
	WithdrawalPending  WithdrawalStatus = "pending"
	WithdrawalApproved WithdrawalStatus = "approved"
	WithdrawalRejected WithdrawalStatus = "rejected"
)

type Withdrawal struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	UserID        uint             `gorm:"index;not null" json:"user_id"`
	Method        string           `gorm:"size:50;not null" json:"method"` // DANA, OVO, GoPay, Bank
	AccountNumber string           `gorm:"size:100;not null" json:"account_number"`
	Amount        int64            `gorm:"not null" json:"amount"`
	Status        WithdrawalStatus `gorm:"size:20;default:'pending'" json:"status"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

type Referral struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ReferrerID     uint      `gorm:"index;not null" json:"referrer_id"`
	ReferredUserID uint      `gorm:"uniqueIndex;not null" json:"referred_user_id"`
	ReferredUser   *User     `gorm:"foreignKey:ReferredUserID" json:"referred_user,omitempty"`
	IsSuccessful   bool      `gorm:"default:false" json:"is_successful"` // true when referred user's first stor is accepted
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ReferralBonus struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Amount    int64     `gorm:"not null" json:"amount"`
	CreatedAt time.Time `json:"created_at"`
}

type Notification struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	Sender    string    `gorm:"size:20;not null" json:"sender"` // "u" (user) or "a" (admin)
	Message   string    `gorm:"type:text;not null" json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
