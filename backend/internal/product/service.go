package product

import (
	"crypto/rand"
	"encoding/hex"
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

type AcceptWithRegisterInput struct {
	InviteToken    string
	Name           string
	Username       string
	Password       string
}

type InitiateTransferByArtisanInput struct {
	QRCode         string
	ArtisanID      uuid.UUID
	ArtisanName    string
	TargetUsername string
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
		ToOwnerID:    &input.OwnerID,
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

	if input.TargetUsername == "" {
		return nil, errors.New("Username tujuan wajib diisi")
	}

	currentOwner, err := s.repo.GetOwnerByID(input.CurrentOwnerID)
	if err != nil {
		return nil, errors.New("Data pemilik saat ini tidak ditemukan")
	}

	targetOwner, err := s.repo.GetOwnerByUsername(input.TargetUsername)
	isNewUser := err != nil

	history := models.TransferHistory{
		ProductID:    product.ID,
		ProductHash:  product.QRCodeHash,
		FromOwnerID:  &input.CurrentOwnerID,
		Status:       "pending",
		InitiatedAt:  time.Now(),
		FromOwner:    currentOwner.Name,
		ToOwner:      input.TargetUsername,
		TransferDate: time.Now(),
	}

	if isNewUser {
		if input.TargetUsername == currentOwner.Username {
			return nil, errors.New("Tidak bisa transfer ke diri sendiri")
		}

		tokenBytes := make([]byte, 16)
		if _, err := rand.Read(tokenBytes); err != nil {
			return nil, errors.New("Gagal membuat token undangan")
		}
		inviteToken := hex.EncodeToString(tokenBytes)
		history.InviteToken = &inviteToken
	} else {
		if targetOwner.ID == input.CurrentOwnerID {
			return nil, errors.New("Tidak bisa transfer ke diri sendiri")
		}
		history.ToOwnerID = &targetOwner.ID
		history.ToOwner = targetOwner.Name
	}

	if err := s.repo.CreateTransferHistory(&history); err != nil {
		return nil, errors.New("Gagal menginisiasi transfer")
	}

	return &history, nil
}

func (s *Service) InitiateTransferByArtisan(input InitiateTransferByArtisanInput) (*models.TransferHistory, error) {
	product, err := s.repo.GetProductByQR(input.QRCode)
	if err != nil {
		return nil, errors.New("Data Wastra tidak ditemukan")
	}

	if product.IsClaimed {
		return nil, errors.New("Wastra sudah diklaim — gunakan fitur transfer pemilik")
	}

	if product.ArtisanID != input.ArtisanID {
		return nil, errors.New("Anda bukan pengrajin yang mendaftarkan wastra ini")
	}

	if input.TargetUsername == "" {
		return nil, errors.New("Username tujuan wajib diisi")
	}

	targetOwner, err := s.repo.GetOwnerByUsername(input.TargetUsername)
	isNewUser := err != nil

	if isNewUser {
		history := models.TransferHistory{
			ProductID:    product.ID,
			ProductHash:  product.QRCodeHash,
			FromOwnerID:  nil,
			Status:       "pending",
			InitiatedAt:  time.Now(),
			FromOwner:    input.ArtisanName,
			ToOwner:      input.TargetUsername,
			TransferDate: time.Now(),
		}

		tokenBytes := make([]byte, 16)
		if _, err := rand.Read(tokenBytes); err != nil {
			return nil, errors.New("Gagal membuat token undangan")
		}
		inviteToken := hex.EncodeToString(tokenBytes)
		history.InviteToken = &inviteToken

		if err := s.repo.CreateTransferHistory(&history); err != nil {
			return nil, errors.New("Gagal menginisiasi transfer")
		}

		return &history, nil
	}

	now := time.Now()
	history := models.TransferHistory{
		ProductID:    product.ID,
		ProductHash:  product.QRCodeHash,
		FromOwnerID:  nil,
		ToOwnerID:    &targetOwner.ID,
		Status:       "accepted",
		InitiatedAt:  now,
		CompletedAt:  &now,
		FromOwner:    input.ArtisanName,
		ToOwner:      targetOwner.Name,
		TransferDate: now,
	}

	if err := s.repo.CreateTransferHistory(&history); err != nil {
		return nil, errors.New("Gagal mencatat transfer")
	}

	product.IsClaimed = true
	product.OwnerID = &targetOwner.ID
	product.OwnerName = targetOwner.Name
	if err := s.repo.UpdateProduct(product); err != nil {
		return nil, errors.New("Gagal memperbarui kepemilikan")
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

	if history.ToOwnerID == nil || *history.ToOwnerID != input.OwnerID {
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

	if history.ToOwnerID == nil || *history.ToOwnerID != input.OwnerID {
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

func (s *Service) GetTransferByInviteToken(token string) (*models.TransferHistory, *models.Product, error) {
	history, err := s.repo.GetTransferByInviteToken(token)
	if err != nil {
		return nil, nil, errors.New("Token undangan tidak valid")
	}

	if history.Status != "pending" {
		return nil, nil, errors.New("Undangan sudah kedaluwarsa atau sudah diproses")
	}

	if history.ToOwnerID != nil {
		return nil, nil, errors.New("Undangan sudah memiliki penerima")
	}

	product, err := s.repo.GetProductByQR(history.ProductHash)
	if err != nil {
		return nil, nil, errors.New("Data Wastra tidak ditemukan")
	}

	return history, product, nil
}

func (s *Service) AcceptTransferWithRegister(input AcceptWithRegisterInput) (*models.TransferHistory, string, string, string, string, string, error) {
	history, err := s.repo.GetTransferByInviteToken(input.InviteToken)
	if err != nil {
		return nil, "", "", "", "", "", errors.New("Token undangan tidak valid")
	}

	if history.Status != "pending" {
		return nil, "", "", "", "", "", errors.New("Undangan sudah kedaluwarsa atau sudah diproses")
	}

	if history.ToOwnerID != nil {
		return nil, "", "", "", "", "", errors.New("Undangan sudah memiliki penerima")
	}

	if history.InviteToken == nil || *history.InviteToken != input.InviteToken {
		return nil, "", "", "", "", "", errors.New("Token undangan tidak valid")
	}

	if input.Name == "" || input.Username == "" || input.Password == "" {
		return nil, "", "", "", "", "", errors.New("Nama, username, dan password wajib diisi")
	}

	exists, err := s.repo.UsernameExists(input.Username, "owner")
	if err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal memeriksa username")
	}
	if exists {
		return nil, "", "", "", "", "", errors.New("Username sudah terdaftar")
	}

	passwordHash, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal memproses password")
	}

	newOwner := models.Owner{
		ID:           uuid.New(),
		Name:         input.Name,
		Username:     input.Username,
		PasswordHash: passwordHash,
	}

	if err := s.repo.CreateOwner(&newOwner); err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal membuat akun pemilik")
	}

	now := time.Now()
	history.ToOwnerID = &newOwner.ID
	history.ToOwner = newOwner.Name
	history.Status = "accepted"
	history.CompletedAt = &now
	if err := s.repo.UpdateTransferHistory(history); err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal memperbarui status transfer")
	}

	product, err := s.repo.GetProductByQR(history.ProductHash)
	if err != nil {
		return nil, "", "", "", "", "", errors.New("Data Wastra tidak ditemukan")
	}

	product.OwnerID = &newOwner.ID
	product.OwnerName = newOwner.Name
	product.IsClaimed = true
	if err := s.repo.UpdateProduct(product); err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal memperbarui kepemilikan wastra")
	}

	accessToken, err := utils.GenerateAccessToken(newOwner.ID, "owner", newOwner.Name)
	if err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal membuat token akses")
	}

	refreshToken, err := utils.GenerateRefreshToken(newOwner.ID, "owner", newOwner.Name)
	if err != nil {
		return nil, "", "", "", "", "", errors.New("Gagal membuat refresh token")
	}

	return history, accessToken, refreshToken, newOwner.ID.String(), newOwner.Name, newOwner.Username, nil
}
