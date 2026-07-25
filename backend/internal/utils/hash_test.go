package utils

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	hash, err := HashPassword("secret123")
	if err != nil {
		t.Fatalf("HashPassword gagal: %v", err)
	}
	if hash == "" {
		t.Fatal("Hash tidak boleh kosong")
	}
	if !CheckPassword("secret123", hash) {
		t.Fatal("CheckPassword harus true untuk password yang benar")
	}
	if CheckPassword("salah", hash) {
		t.Fatal("CheckPassword harus false untuk password yang salah")
	}
}

func TestHashClaimCode(t *testing.T) {
	code := "ABC12345"
	hash, err := HashClaimCode(code)
	if err != nil {
		t.Fatalf("HashClaimCode gagal: %v", err)
	}
	if !CheckClaimCode(code, hash) {
		t.Fatal("CheckClaimCode harus true untuk kode yang benar")
	}
	if CheckClaimCode("WRONG", hash) {
		t.Fatal("CheckClaimCode harus false untuk kode yang salah")
	}
}

func TestCheckPassword_Empty(t *testing.T) {
	if CheckPassword("", "") {
		t.Fatal("CheckPassword harus false untuk string kosong")
	}
}
