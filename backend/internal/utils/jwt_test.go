package utils

import (
	"testing"

	"github.com/google/uuid"
)

func TestGenerateAndValidateAccessToken(t *testing.T) {
	userID := uuid.New()
	token, err := GenerateAccessToken(userID, "artisan", "Test Artisan")
	if err != nil {
		t.Fatalf("GenerateAccessToken gagal: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken gagal: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("UserID tidak cocok: got %v, want %v", claims.UserID, userID)
	}
	if claims.Role != "artisan" {
		t.Errorf("Role tidak cocok: got %s, want artisan", claims.Role)
	}
	if claims.Name != "Test Artisan" {
		t.Errorf("Name tidak cocok: got %s, want Test Artisan", claims.Name)
	}
}

func TestGenerateAndValidateRefreshToken(t *testing.T) {
	userID := uuid.New()
	token, err := GenerateRefreshToken(userID, "owner", "Test Owner")
	if err != nil {
		t.Fatalf("GenerateRefreshToken gagal: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken gagal: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("UserID tidak cocok: got %v, want %v", claims.UserID, userID)
	}
	if claims.Role != "owner" {
		t.Errorf("Role tidak cocok: got %s, want owner", claims.Role)
	}
}

func TestValidateToken_Invalid(t *testing.T) {
	_, err := ValidateToken("invalid-token-here")
	if err == nil {
		t.Fatal("ValidateToken harus error untuk token invalid")
	}
}

func TestValidateToken_Expired(t *testing.T) {
	_, err := ValidateToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.garbage.garbage")
	if err == nil {
		t.Fatal("ValidateToken harus error untuk token sampah")
	}
}
