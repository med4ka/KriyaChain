package middleware

import (
	"net/http"
	"strings"

	"prepdev-backend/internal/utils"

	"github.com/gin-gonic/gin"
)

func OwnerAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Token autentikasi diperlukan"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Format token tidak valid"})
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Token tidak valid atau kedaluwarsa"})
			c.Abort()
			return
		}

		if claims.Role != "owner" {
			c.JSON(http.StatusForbidden, gin.H{"status": "error", "message": "Akses khusus pemilik"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID.String())
		c.Set("role", claims.Role)
		c.Next()
	}
}
