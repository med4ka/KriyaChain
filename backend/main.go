package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"prepdev-backend/config"
	"prepdev-backend/controllers"
	"prepdev-backend/internal/auth"
	"prepdev-backend/internal/middleware"
	internalproduct "prepdev-backend/internal/product"
	"prepdev-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"
)

var (
	limiters = make(map[string]*rate.Limiter)
	mu       sync.Mutex
)

func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()
	limiter, exists := limiters[ip]
	if !exists {
		limiter = rate.NewLimiter(20, 50)
		limiters[ip] = limiter
	}
	return limiter
}

func RateLimiterMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getLimiter(ip)
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{"status": "error", "message": "Santai! Terlalu banyak request."})
			c.Abort()
			return
		}
		c.Next()
	}
}

func parseAllowedOrigins(raw string) map[string]bool {
	origins := make(map[string]bool)
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins[o] = true
		}
	}
	return origins
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: File .env tidak ditemukan.")
	}

	config.ConnectDB()

	log.Println("Menjalankan Sinkronisasi Database...")
	err = config.DB.AutoMigrate(&models.Product{}, &models.TransferHistory{}, &models.Artisan{}, &models.Owner{})
	if err != nil {
		log.Fatalf("FATAL ERROR: Gagal migrate database: %v", err)
	}
	log.Println("Tabel [products], [transfer_histories], [artisans], [owners] Berhasil Dibuat/Diupdate!")

	r := gin.Default()
	r.Use(RateLimiterMiddleware())
	r.Static("/uploads", "./uploads")

	allowedOrigins := parseAllowedOrigins(os.Getenv("ALLOWED_ORIGINS"))
	if len(allowedOrigins) == 0 {
		log.Println("WARNING: ALLOWED_ORIGINS tidak diset — semua origin akan ditolak!")
	}
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" && allowedOrigins[origin] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if origin != "" {
			log.Printf("WARNING: CORS blocked origin %q", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/api/ping", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "OK"}) })

	authRepo := auth.NewRepository()
	authSvc := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authSvc)

	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/artisan/register", authHandler.RegisterArtisan)
		authGroup.POST("/artisan/login", authHandler.LoginArtisan)
		authGroup.POST("/owner/register", authHandler.RegisterOwner)
		authGroup.POST("/owner/login", authHandler.LoginOwner)
		authGroup.POST("/refresh", authHandler.RefreshToken)
	}

	prodRepo := internalproduct.NewRepository()
	prodSvc := internalproduct.NewService(prodRepo)
	prodHandler := internalproduct.NewHandler(prodSvc)

	r.GET("/api/products", controllers.GetAllProducts)
	r.GET("/api/stats", controllers.GetStats)
	r.GET("/api/products/scan/:qr_code", controllers.GetProductByQR)
	r.GET("/api/products/history/:qr_code", controllers.GetProductHistory)
	r.GET("/api/products/export", controllers.ExportProductsCSV)

	r.POST("/api/upload", middleware.ArtisanAuth(), internalproduct.UploadImage)
	r.POST("/api/products", middleware.ArtisanAuth(), controllers.CreateProduct)
	r.PATCH("/api/products/edit/:qr_code", middleware.ArtisanAuth(), controllers.EditProduct)

	r.PUT("/api/products/claim/:qr_code", middleware.OwnerAuth(), prodHandler.ClaimProduct)
	r.POST("/api/products/transfer/:qr_code", middleware.OwnerAuth(), prodHandler.InitiateTransfer)
	r.POST("/api/products/transfer-by-artisan/:qr_code", middleware.ArtisanAuth(), prodHandler.InitiateTransferByArtisan)

	r.GET("/api/transfers/pending", middleware.OwnerAuth(), prodHandler.GetPendingTransfers)
	r.PATCH("/api/transfers/accept", middleware.OwnerAuth(), prodHandler.AcceptTransfer)
	r.PATCH("/api/transfers/reject", middleware.OwnerAuth(), prodHandler.RejectTransfer)

	r.GET("/api/transfers/invite/:token", prodHandler.GetTransferByInviteToken)
	r.POST("/api/transfers/accept-with-register", prodHandler.AcceptTransferWithRegister)

	fmt.Println("Server running on http://localhost:8080")
	r.Run(":8080")
}
