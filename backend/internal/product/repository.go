package product

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

func (r *Repository) GetProductByQR(qrCode string) (*models.Product, error) {
	var product models.Product
	err := r.db.Where("qr_code_hash = ?", qrCode).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *Repository) UpdateProduct(product *models.Product) error {
	return r.db.Save(product).Error
}

func (r *Repository) CreateTransferHistory(h *models.TransferHistory) error {
	return r.db.Create(h).Error
}

func (r *Repository) GetTransferHistoryByID(id uint) (*models.TransferHistory, error) {
	var h models.TransferHistory
	err := r.db.First(&h, id).Error
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *Repository) UpdateTransferHistory(h *models.TransferHistory) error {
	return r.db.Save(h).Error
}

func (r *Repository) GetPendingTransfersByOwner(ownerID uuid.UUID) ([]models.TransferHistory, error) {
	var histories []models.TransferHistory
	err := r.db.Where("to_owner_id = ? AND status = ?", ownerID, "pending").
		Order("initiated_at desc").Find(&histories).Error
	return histories, err
}

func (r *Repository) GetProductHistory(qrCode string) ([]models.TransferHistory, error) {
	var histories []models.TransferHistory
	err := r.db.Where("product_hash = ?", qrCode).
		Order("transfer_date desc").Find(&histories).Error
	return histories, err
}

func (r *Repository) GetOwnerByID(id uuid.UUID) (*models.Owner, error) {
	var owner models.Owner
	err := r.db.Where("id = ?", id).First(&owner).Error
	if err != nil {
		return nil, err
	}
	return &owner, nil
}

func (r *Repository) GetOwnerByUsername(username string) (*models.Owner, error) {
	var owner models.Owner
	err := r.db.Where("username = ?", username).First(&owner).Error
	if err != nil {
		return nil, err
	}
	return &owner, nil
}

func (r *Repository) GetArtisanByID(id uuid.UUID) (*models.Artisan, error) {
	var artisan models.Artisan
	err := r.db.Where("id = ?", id).First(&artisan).Error
	if err != nil {
		return nil, err
	}
	return &artisan, nil
}
