package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"prepdev-backend/config"
	"prepdev-backend/controllers"
	"prepdev-backend/internal/auth"
	"prepdev-backend/internal/utils"
	"prepdev-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Gagal connect SQLite: %v", err)
	}
	err = db.AutoMigrate(&models.Product{}, &models.TransferHistory{}, &models.Artisan{}, &models.Owner{})
	if err != nil {
		t.Fatalf("Gagal migrate: %v", err)
	}
	config.DB = db

	os.Setenv("JWT_SECRET", "test-secret-key-kriyachain")
	utils.GenerateAccessToken(uuid.New(), "artisan", "Test")
	utils.GenerateAccessToken(uuid.New(), "owner", "TestOwner")
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	authRepo := auth.NewRepository()
	authSvc := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authSvc)

	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/artisan/register", authHandler.RegisterArtisan)
		authGroup.POST("/artisan/login", authHandler.LoginArtisan)
		authGroup.POST("/owner/register", authHandler.RegisterOwner)
		authGroup.POST("/owner/login", authHandler.LoginOwner)
	}

	r.GET("/api/products", controllers.GetAllProducts)
	r.GET("/api/ping", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "OK"}) })

	return r
}

func TestPingEndpoint(t *testing.T) {
	setupTestDB(t)
	router := setupRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/ping", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected 200, got %d", w.Code)
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "OK" {
		t.Errorf("Expected status OK, got %s", resp["status"])
	}
}

func TestRegisterArtisan(t *testing.T) {
	setupTestDB(t)
	router := setupRouter()

	body := map[string]string{
		"name":     "Pengrajin Test",
		"username": "pengrajin@test.com",
		"password": "rahasia123",
	}
	jsonBody, _ := json.Marshal(body)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/auth/artisan/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	fmt.Println("Register artisan response:", w.Code, w.Body.String())

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Errorf("Expected 200/201, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "success" {
		t.Errorf("Expected success, got %v", resp["status"])
	}
}

func TestRegisterAndLoginArtisan(t *testing.T) {
	setupTestDB(t)
	router := setupRouter()

	
	registerBody := map[string]string{
		"name":     "Batik Maker",
		"username": "batik@test.com",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(registerBody)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/auth/artisan/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("Register gagal: %d %s", w.Code, w.Body.String())
	}

	
	loginBody := map[string]string{
		"username": "batik@test.com",
		"password": "password123",
	}
	jsonBody, _ = json.Marshal(loginBody)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/auth/artisan/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Login gagal: %d %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "success" {
		t.Errorf("Login tidak sukses: %v", resp["status"])
	}
}

func TestGetProductsEmpty(t *testing.T) {
	setupTestDB(t)
	router := setupRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/products", nil)
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "success" {
		t.Errorf("Expected success, got %v", resp["status"])
	}
}

func TestRegisterAndLoginOwner(t *testing.T) {
	setupTestDB(t)
	router := setupRouter()


	registerBody := map[string]string{
		"name":     "Kolektor Test",
		"username": "kolektor@test.com",
		"password": "rahasia456",
	}
	jsonBody, _ := json.Marshal(registerBody)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/auth/owner/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("Register owner gagal: %d %s", w.Code, w.Body.String())
	}

	
	loginBody := map[string]string{
		"username": "kolektor@test.com",
		"password": "rahasia456",
	}
	jsonBody, _ = json.Marshal(loginBody)
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("POST", "/api/auth/owner/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Login owner gagal: %d %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "success" {
		t.Errorf("Login owner tidak sukses: %v", resp["status"])
	}
}

func TestMain(m *testing.M) {
	log.SetOutput(os.Stdout)
	os.Exit(m.Run())
}
