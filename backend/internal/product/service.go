package product

import (
	"errors"
	"prepdev-backend/internal/utils"
	"prepdev-backend/models"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type ClaimInput struct {
	QRCode    string
	OwnerID   uuid.UUID
	OwnerName string
	ClaimCode string
}

type InitiateTransferInput struct {
	QRCode         string
	CurrentOwnerID uuid.UUID
	TargetUsername string
}

type TransferStatusInput struct {
	TransferID uint
	OwnerID    uuid.UUID
}

func (s *Service) ClaimProduct(input ClaimInput) (*models.Product, error) {
	product, err := s.repo.GetProductByQR(input.QRCode)
	if err != nil {
		return nil, errors.New("Data Wastra tidak ditemukan")
	}

	if product.IsClaimed {
		return nil, errors.New("KLAIM DITOLAK! Wastra sudah dimiliki")
	}

	if !utils.CheckClaimCode(input.ClaimCode, product.ClaimCodeHash) {
		return nil, errors.New("Kode klaim tidak cocok — periksa label fisik pada kain")
	}

	product.IsClaimed = true
	product.OwnerID = &input.OwnerID
	product.OwnerName = input.OwnerName

	if err := s.repo.UpdateProduct(product); err != nil {
		return nil, errors.New("Gagal memperbarui data wastra")
	}

	history := models.TransferHistory{
		ProductID:    product.ID,
		ProductHash:  product.QRCodeHash,
		FromOwnerID:  nil,
		ToOwnerID:    input.OwnerID,
		Status:       "accepted",
		InitiatedAt:  time.Now(),
		CompletedAt:  &[]time.Time{time.Now()}[0],
		FromOwner:    product.Artisan,
		ToOwner:      input.OwnerName,
		TransferDate: time.Now(),
	}

	if err := s.repo.CreateTransferHistory(&history); err != nil {
		return nil, errors.New("Gagal mencatat riwayat klaim")
	}

	return product, nil
}

func (s *Service) InitiateTransfer(input InitiateTransferInput) (*models.TransferHistory, error) {
	product, err := s.repo.GetProductByQR(input.QRCode)
	if err != nil {
		return nil, errors.New("Data Wastra tidak ditemukan")
	}

	if product.OwnerID == nil || *product.OwnerID != input.CurrentOwnerID {
		return nil, errors.New("Anda bukan pemilik sah wastra ini")
	}

	targetOwner, err := s.repo.GetOwnerByUsername(input.TargetUsername)
	if err != nil {
		return nil, errors.New("Username pemilik tujuan tidak ditemukan")
	}

	if targetOwner.ID == input.CurrentOwnerID {
		return nil, errors.New("Tidak bisa transfer ke diri sendiri")
	}

	currentOwner, err := s.repo.GetOwnerByID(input.CurrentOwnerID)
	if err != nil {
		return nil, errors.New("Data pemilik saat ini tidak ditemukan")
	}

	history := models.TransferHistory{
		ProductID:    product.ID,
		ProductHash:  product.QRCodeHash,
		FromOwnerID:  &input.CurrentOwnerID,
		ToOwnerID:    targetOwner.ID,
		Status:       "pending",
		InitiatedAt:  time.Now(),
		FromOwner:    currentOwner.Name,
		ToOwner:      targetOwner.Name,
		TransferDate: time.Now(),
	}

	if err := s.repo.CreateTransferHistory(&history); err != nil {
		return nil, errors.New("Gagal menginisiasi transfer")
	}

	return &history, nil
}

func (s *Service) AcceptTransfer(input TransferStatusInput) (*models.TransferHistory, error) {
	history, err := s.repo.GetTransferHistoryByID(input.TransferID)
	if err != nil {
		return nil, errors.New("Data transfer tidak ditemukan")
	}

	if history.Status != "pending" {
		return nil, errors.New("Transfer sudah diproses sebelumnya")
	}

	if history.ToOwnerID != input.OwnerID {
		return nil, errors.New("Anda bukan tujuan transfer ini")
	}

	product, err := s.repo.GetProductByQR(history.ProductHash)
	if err != nil {
		return nil, errors.New("Data Wastra tidak ditemukan")
	}

	newOwner, err := s.repo.GetOwnerByID(input.OwnerID)
	if err != nil {
		return nil, errors.New("Data pemilik tidak ditemukan")
	}

	now := time.Now()
	history.Status = "accepted"
	history.CompletedAt = &now
	if err := s.repo.UpdateTransferHistory(history); err != nil {
		return nil, errors.New("Gagal memperbarui status transfer")
	}

	product.OwnerID = &input.OwnerID
	product.OwnerName = newOwner.Name
	product.IsClaimed = true
	if err := s.repo.UpdateProduct(product); err != nil {
		return nil, errors.New("Gagal memperbarui kepemilikan wastra")
	}

	return history, nil
}

func (s *Service) RejectTransfer(input TransferStatusInput) (*models.TransferHistory, error) {
	history, err := s.repo.GetTransferHistoryByID(input.TransferID)
	if err != nil {
		return nil, errors.New("Data transfer tidak ditemukan")
	}

	if history.Status != "pending" {
		return nil, errors.New("Transfer sudah diproses sebelumnya")
	}

	if history.ToOwnerID != input.OwnerID {
		return nil, errors.New("Anda bukan tujuan transfer ini")
	}

	now := time.Now()
	history.Status = "rejected"
	history.CompletedAt = &now
	if err := s.repo.UpdateTransferHistory(history); err != nil {
		return nil, errors.New("Gagal memperbarui status transfer")
	}

	return history, nil
}

func (s *Service) GetPendingTransfers(ownerID uuid.UUID) ([]models.TransferHistory, error) {
	return s.repo.GetPendingTransfersByOwner(ownerID)
}
