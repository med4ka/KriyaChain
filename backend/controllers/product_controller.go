package controllers

import (
	"encoding/csv"
	"net/http"
	"prepdev-backend/config"
	"prepdev-backend/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CreateProductInput struct {
	Name        string `json:"name" binding:"required"`
	Artisan     string `json:"artisan" binding:"required"`
	Origin      string `json:"origin"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
}

func CreateProduct(c *gin.Context) {
	var input CreateProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "error": "Data tidak lengkap!"})
		return
	}

	uniqueQRHash := uuid.New().String()

	product := models.Product{
		Name:        input.Name,
		Artisan:     input.Artisan,
		Origin:      input.Origin,
		Description: input.Description,
		ImageURL:    input.ImageURL,
		QRCodeHash:  uniqueQRHash,
		IsClaimed:   false,
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "error": "Gagal menyimpan data wastra"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "message": "Data Wastra Berhasil Ditambahkan!", "data": product})
}

type EditProductInput struct {
	Name        string `json:"name" binding:"required"`
	Artisan     string `json:"artisan" binding:"required"`
	Origin      string `json:"origin"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
}

func EditProduct(c *gin.Context) {
	qrCode := c.Param("qr_code")
	var input EditProductInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Data tidak lengkap!"})
		return
	}

	var product models.Product
	if err := config.DB.Where("qr_code_hash = ?", qrCode).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Data Wastra tidak ditemukan!"})
		return
	}

	product.Name = input.Name
	product.Artisan = input.Artisan
	product.Origin = input.Origin
	product.Description = input.Description
	if input.ImageURL != "" {
		product.ImageURL = input.ImageURL
	}

	config.DB.Save(&product)
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Data Wastra berhasil diperbarui!", "data": product})
}

func GetProductByQR(c *gin.Context) {
	qrCode := c.Param("qr_code")
	var product models.Product
	if err := config.DB.Where("qr_code_hash = ?", qrCode).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "AWAS! Data Wastra tidak ditemukan."})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Wastra Asli Terverifikasi!", "data": product})
}

type ClaimProductInput struct {
	OwnerName string `json:"owner_name" binding:"required"`
}

func ClaimProduct(c *gin.Context) {
	qrCode := c.Param("qr_code")
	var input ClaimProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Nama pemilik wajib diisi!"})
		return
	}

	var product models.Product
	if err := config.DB.Where("qr_code_hash = ?", qrCode).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Data Wastra tidak ditemukan!"})
		return
	}

	if product.IsClaimed {
		c.JSON(http.StatusConflict, gin.H{"status": "error", "message": "KLAIM DITOLAK! Sudah dimiliki: " + product.OwnerName})
		return
	}

	product.IsClaimed = true
	product.OwnerName = input.OwnerName
	config.DB.Save(&product)
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Selamat! Wastra resmi menjadi milik Anda.", "data": product})
}

func TransferOwnership(c *gin.Context) {
	qrCode := c.Param("qr_code")
	var input struct {
		NewOwnerName string `json:"new_owner_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Nama pemilik baru wajib diisi!"})
		return
	}

	var product models.Product
	if err := config.DB.Where("qr_code_hash = ?", qrCode).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Data Wastra tidak ditemukan!"})
		return
	}

	oldOwner := product.OwnerName
	if oldOwner == "" {
		oldOwner = product.Artisan
	}

	history := models.TransferHistory{
		ProductID:    product.ID,
		ProductHash:  product.QRCodeHash,
		FromOwner:    oldOwner,
		ToOwner:      input.NewOwnerName,
		TransferDate: time.Now(),
	}

	if err := config.DB.Create(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mencatat riwayat transfer!"})
		return
	}

	product.IsClaimed = true
	product.OwnerName = input.NewOwnerName
	config.DB.Save(&product)

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Kepemilikan berhasil ditransfer!", "data": product})
}

func GetProductHistory(c *gin.Context) {
	qrCode := c.Param("qr_code")
	var product models.Product
	if err := config.DB.Where("qr_code_hash = ?", qrCode).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Data Wastra tidak ditemukan!"})
		return
	}

	var histories []models.TransferHistory
	if err := config.DB.Where("product_hash = ?", qrCode).Order("transfer_date desc").Find(&histories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil jejak wastra"})
		return
	}

	if len(histories) == 0 {
		c.JSON(http.StatusOK, gin.H{"status": "success", "data": []models.TransferHistory{}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": histories})
}

func GetAllProducts(c *gin.Context) {
	var products []models.Product
	if err := config.DB.Order("created_at desc").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil data galeri"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": products})
}

func GetStats(c *gin.Context) {
	var totalProducts int64
	var totalClaimed int64
	var totalTransfers int64

	config.DB.Model(&models.Product{}).Count(&totalProducts)
	config.DB.Model(&models.Product{}).Where("is_claimed = ?", true).Count(&totalClaimed)
	config.DB.Model(&models.TransferHistory{}).Count(&totalTransfers)

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": gin.H{"total_products": totalProducts, "total_claimed": totalClaimed, "total_transfers": totalTransfers}})
}

func ExportProductsCSV(c *gin.Context) {
	var products []models.Product
	if err := config.DB.Order("created_at desc").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
		return
	}

	c.Writer.Header().Set("Content-Type", "text/csv")
	c.Writer.Header().Set("Content-Disposition", "attachment;filename=Laporan_Master_Wastra.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{"UUID Wastra", "Nama Wastra", "Pengrajin", "Asal Daerah", "Status", "Pemilik Saat Ini", "Tanggal Registrasi"})

	for _, p := range products {
		status := "Tersedia"
		if p.IsClaimed {
			status = "Dimiliki"
		}
		writer.Write([]string{p.QRCodeHash, p.Name, p.Artisan, p.Origin, status, p.OwnerName, p.CreatedAt.Format("02 Jan 2006 15:04")})
	}
}
