package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"prepdev-backend/config"
	"prepdev-backend/controllers"
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
		limiter = rate.NewLimiter(2, 5)
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

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: File .env tidak ditemukan.")
	}

	config.ConnectDB()

	log.Println("Menjalankan Sinkronisasi Database...")
	err = config.DB.AutoMigrate(&models.Product{}, &models.TransferHistory{})
	if err != nil {
		log.Fatalf("FATAL ERROR: Gagal migrate database: %v", err)
	}
	log.Println("Tabel [products] dan [transfer_histories] Berhasil Dibuat/Diupdate!")

	r := gin.Default()
	r.Use(RateLimiterMiddleware())

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/api/ping", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "OK"}) })

	r.POST("/api/products", controllers.CreateProduct)
	r.GET("/api/products/scan/:qr_code", controllers.GetProductByQR)
	r.PUT("/api/products/claim/:qr_code", controllers.ClaimProduct)
	r.GET("/api/products/history/:qr_code", controllers.GetProductHistory)
	r.PATCH("/api/products/transfer/:qr_code", controllers.TransferOwnership)
	r.GET("/api/products", controllers.GetAllProducts)
	r.GET("/api/stats", controllers.GetStats)
	r.GET("/api/products/export", controllers.ExportProductsCSV)

	r.PATCH("/api/products/edit/:qr_code", controllers.EditProduct)

	fmt.Println("Server running on http://localhost:8080")
	r.Run(":8080")
}
