package models

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Artisan     string         `gorm:"type:varchar(100);not null" json:"artisan"`
	Origin      string         `gorm:"type:varchar(100)" json:"origin"`
	Description string         `gorm:"type:text" json:"description"`
	ImageURL    string         `gorm:"type:text" json:"image_url"`
	QRCodeHash  string         `gorm:"type:varchar(255);uniqueIndex;not null" json:"qr_code"`
	IsClaimed   bool           `gorm:"default:false" json:"is_claimed"`
	OwnerName   string         `gorm:"type:varchar(100)" json:"owner_name"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type TransferHistory struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ProductID    uint      `json:"product_id"`
	ProductHash  string    `gorm:"type:varchar(255)" json:"product_hash"`
	FromOwner    string    `gorm:"type:varchar(100)" json:"from_owner"`
	ToOwner      string    `gorm:"type:varchar(100)" json:"to_owner"`
	TransferDate time.Time `json:"transfer_date"`
}
