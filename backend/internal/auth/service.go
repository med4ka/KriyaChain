package auth

import (
	"errors"
	"prepdev-backend/internal/utils"
	"prepdev-backend/models"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type RegisterInput struct {
	Name     string
	Username string
	Password string
}

type LoginInput struct {
	Username string
	Password string
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	UserID       string `json:"user_id"`
	Name         string `json:"name"`
	Username     string `json:"username"`
}

func (s *Service) RegisterArtisan(input RegisterInput) (*AuthResponse, error) {
	if input.Name == "" || input.Username == "" || input.Password == "" {
		return nil, errors.New("name, username, dan password wajib diisi")
	}

	exists, err := s.repo.UsernameExists(input.Username, "artisan")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username sudah terdaftar")
	}

	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	artisan := models.Artisan{
		ID:           uuid.New(),
		Name:         input.Name,
		Username:     input.Username,
		PasswordHash: hash,
		IsVerified:   false,
	}

	if err := s.repo.CreateArtisan(&artisan); err != nil {
		return nil, err
	}

	accessToken, err := utils.GenerateAccessToken(artisan.ID, "artisan")
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(artisan.ID, "artisan")
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       artisan.ID.String(),
		Name:         artisan.Name,
		Username:     artisan.Username,
	}, nil
}

func (s *Service) LoginArtisan(input LoginInput) (*AuthResponse, error) {
	if input.Username == "" || input.Password == "" {
		return nil, errors.New("username dan password wajib diisi")
	}

	artisan, err := s.repo.GetArtisanByUsername(input.Username)
	if err != nil {
		return nil, errors.New("username atau password salah")
	}

	if !utils.CheckPassword(input.Password, artisan.PasswordHash) {
		return nil, errors.New("username atau password salah")
	}

	accessToken, err := utils.GenerateAccessToken(artisan.ID, "artisan")
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(artisan.ID, "artisan")
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       artisan.ID.String(),
		Name:         artisan.Name,
		Username:     artisan.Username,
	}, nil
}

func (s *Service) RegisterOwner(input RegisterInput) (*AuthResponse, error) {
	if input.Name == "" || input.Username == "" || input.Password == "" {
		return nil, errors.New("name, username, dan password wajib diisi")
	}

	exists, err := s.repo.UsernameExists(input.Username, "owner")
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("username sudah terdaftar")
	}

	hash, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	owner := models.Owner{
		ID:           uuid.New(),
		Name:         input.Name,
		Username:     input.Username,
		PasswordHash: hash,
	}

	if err := s.repo.CreateOwner(&owner); err != nil {
		return nil, err
	}

	accessToken, err := utils.GenerateAccessToken(owner.ID, "owner")
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(owner.ID, "owner")
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       owner.ID.String(),
		Name:         owner.Name,
		Username:     owner.Username,
	}, nil
}

func (s *Service) LoginOwner(input LoginInput) (*AuthResponse, error) {
	if input.Username == "" || input.Password == "" {
		return nil, errors.New("username dan password wajib diisi")
	}

	owner, err := s.repo.GetOwnerByUsername(input.Username)
	if err != nil {
		return nil, errors.New("username atau password salah")
	}

	if !utils.CheckPassword(input.Password, owner.PasswordHash) {
		return nil, errors.New("username atau password salah")
	}

	accessToken, err := utils.GenerateAccessToken(owner.ID, "owner")
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshToken(owner.ID, "owner")
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       owner.ID.String(),
		Name:         owner.Name,
		Username:     owner.Username,
	}, nil
}
