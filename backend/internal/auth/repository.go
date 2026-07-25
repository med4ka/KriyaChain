package auth

import (
	"prepdev-backend/config"
	"prepdev-backend/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository() *Repository {
	return &Repository{db: config.DB}
}

func (r *Repository) CreateArtisan(artisan *models.Artisan) error {
	return r.db.Create(artisan).Error
}

func (r *Repository) GetArtisanByUsername(username string) (*models.Artisan, error) {
	var artisan models.Artisan
	err := r.db.Where("username = ?", username).First(&artisan).Error
	if err != nil {
		return nil, err
	}
	return &artisan, nil
}

func (r *Repository) GetArtisanByID(id uuid.UUID) (*models.Artisan, error) {
	var artisan models.Artisan
	err := r.db.Where("id = ?", id).First(&artisan).Error
	if err != nil {
		return nil, err
	}
	return &artisan, nil
}

func (r *Repository) CreateOwner(owner *models.Owner) error {
	return r.db.Create(owner).Error
}

func (r *Repository) GetOwnerByUsername(username string) (*models.Owner, error) {
	var owner models.Owner
	err := r.db.Where("username = ?", username).First(&owner).Error
	if err != nil {
		return nil, err
	}
	return &owner, nil
}

func (r *Repository) GetOwnerByID(id uuid.UUID) (*models.Owner, error) {
	var owner models.Owner
	err := r.db.Where("id = ?", id).First(&owner).Error
	if err != nil {
		return nil, err
	}
	return &owner, nil
}

func (r *Repository) UsernameExists(username string, role string) (bool, error) {
	var count int64
	if role == "artisan" {
		err := r.db.Model(&models.Artisan{}).Where("username = ?", username).Count(&count).Error
		return count > 0, err
	}
	err := r.db.Model(&models.Owner{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}
