package product

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	MaxUploadSize = 5 << 20 // 5 MB
	UploadDir     = "uploads"
)

var allowedContentTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

func init() {
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Gagal membuat folder uploads: %v", err))
	}
}

func UploadImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "File gambar wajib diunggah!"})
		return
	}
	defer file.Close()

	buf := make([]byte, 512)
	if _, err := file.Read(buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca file"})
		return
	}
	file.Seek(0, io.SeekStart)

	contentType := http.DetectContentType(buf)
	ext, allowed := allowedContentTypes[contentType]
	if !allowed {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Format file tidak didukung! Gunakan JPEG, PNG, atau WebP"})
		return
	}

	if header.Size > MaxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Ukuran file maksimal 5 MB"})
		return
	}

	filename := uuid.New().String() + ext
	destPath := filepath.Join(UploadDir, filename)

	out, err := os.Create(destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menyimpan file"})
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menulis file"})
		return
	}

	imageURL := "/" + strings.ReplaceAll(destPath, "\\", "/")

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Gambar berhasil diunggah!", "data": gin.H{"image_url": imageURL}})
}
