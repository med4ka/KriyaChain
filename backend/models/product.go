package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Name          string         `gorm:"type:varchar(100);not null" json:"name"`
	Artisan       string         `gorm:"type:varchar(100);not null" json:"artisan"`
	ArtisanID     uuid.UUID      `gorm:"type:uuid;not null" json:"artisan_id"`
	Origin        string         `gorm:"type:varchar(100)" json:"origin"`
	Description   string         `gorm:"type:text" json:"description"`
	ImageURL      string         `gorm:"type:text" json:"image_url"`
	QRCodeHash    string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"qr_code"`
	ClaimCodeHash string         `gorm:"type:text;not null" json:"-"`
	IsClaimed     bool           `gorm:"default:false" json:"is_claimed"`
	OwnerID       *uuid.UUID     `gorm:"type:uuid" json:"owner_id"`
	OwnerName     string         `gorm:"type:varchar(100)" json:"owner_name"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

type TransferHistory struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	ProductID    uint       `json:"product_id"`
	ProductHash  string     `gorm:"type:varchar(255)" json:"product_hash"`
	FromOwnerID  *uuid.UUID `gorm:"type:uuid" json:"from_owner_id"`
	ToOwnerID    uuid.UUID  `gorm:"type:uuid;not null" json:"to_owner_id"`
	Status       string     `gorm:"type:varchar(20);default:pending" json:"status"`
	InitiatedAt  time.Time  `json:"initiated_at"`
	CompletedAt  *time.Time `json:"completed_at"`
	FromOwner    string     `gorm:"type:varchar(100)" json:"from_owner"`
	ToOwner      string     `gorm:"type:varchar(100)" json:"to_owner"`
	TransferDate time.Time  `json:"transfer_date"`
}
