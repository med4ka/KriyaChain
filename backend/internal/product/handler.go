package product

import (
	"net/http"

	"prepdev-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type claimRequest struct {
	ClaimCode string `json:"claim_code" binding:"required"`
}

func (h *Handler) ClaimProduct(c *gin.Context) {
	qrCode := c.Param("qr_code")

	var req claimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Kode klaim wajib diisi"})
		return
	}

	ownerIDStr, _ := c.Get("user_id")
	ownerID, err := uuid.Parse(ownerIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca identitas pemilik"})
		return
	}

	ownerName, _ := c.Get("user_name")
	ownerNameStr := ""
	if ownerName != nil {
		ownerNameStr = ownerName.(string)
	}

	product, err := h.service.ClaimProduct(ClaimInput{
		QRCode:    qrCode,
		OwnerID:   ownerID,
		OwnerName: ownerNameStr,
		ClaimCode: req.ClaimCode,
	})
	if err != nil {
		status := http.StatusBadRequest
		if len(err.Error()) >= 6 && err.Error()[:6] == "KLAIM " {
			status = http.StatusConflict
		}
		c.JSON(status, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Selamat! Wastra resmi menjadi milik Anda.", "data": product})
}

type initiateTransferRequest struct {
	TargetUsername string `json:"target_username" binding:"required"`
}

func (h *Handler) InitiateTransfer(c *gin.Context) {
	qrCode := c.Param("qr_code")

	var req initiateTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Username pemilik tujuan wajib diisi"})
		return
	}

	ownerIDStr, _ := c.Get("user_id")
	ownerID, err := uuid.Parse(ownerIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca identitas pemilik"})
		return
	}

	history, err := h.service.InitiateTransfer(InitiateTransferInput{
		QRCode:         qrCode,
		CurrentOwnerID: ownerID,
		TargetUsername: req.TargetUsername,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	msg := "Permintaan transfer dikirim. Menunggu konfirmasi penerima."
	if history.InviteToken != nil && *history.InviteToken != "" {
		msg = "Undangan transfer dibuat. Bagikan kode undangan ke penerima."
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": msg,
		"data":    history,
	})
}

func (h *Handler) InitiateTransferByArtisan(c *gin.Context) {
	qrCode := c.Param("qr_code")

	var req initiateTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Username pemilik tujuan wajib diisi"})
		return
	}

	artisanIDStr, _ := c.Get("user_id")
	artisanID, err := uuid.Parse(artisanIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca identitas pengrajin"})
		return
	}

	artisanName, _ := c.Get("user_name")
	artisanNameStr := ""
	if artisanName != nil {
		artisanNameStr = artisanName.(string)
	}

	history, err := h.service.InitiateTransferByArtisan(InitiateTransferByArtisanInput{
		QRCode:         qrCode,
		ArtisanID:      artisanID,
		ArtisanName:    artisanNameStr,
		TargetUsername: req.TargetUsername,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	msg := "Kepemilikan berhasil ditransfer!"
	if history.InviteToken != nil && *history.InviteToken != "" {
		msg = "Undangan transfer dibuat. Bagikan kode undangan ke penerima."
	} else if history.Status == "pending" {
		msg = "Permintaan transfer dikirim. Menunggu konfirmasi penerima."
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": msg,
		"data":    history,
	})
}

func (h *Handler) AcceptTransfer(c *gin.Context) {
	h.handleTransferStatus(c, "accept")
}

func (h *Handler) RejectTransfer(c *gin.Context) {
	h.handleTransferStatus(c, "reject")
}

func (h *Handler) handleTransferStatus(c *gin.Context, action string) {
	var req struct {
		TransferID uint `json:"transfer_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "ID transfer wajib diisi"})
		return
	}

	ownerIDStr, _ := c.Get("user_id")
	ownerID, err := uuid.Parse(ownerIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca identitas pemilik"})
		return
	}

	input := TransferStatusInput{
		TransferID: req.TransferID,
		OwnerID:    ownerID,
	}

	var history *models.TransferHistory
	if action == "accept" {
		history, err = h.service.AcceptTransfer(input)
	} else {
		history, err = h.service.RejectTransfer(input)
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	msg := "Transfer diterima! Kepemilikan wastra resmi berpindah."
	if action == "reject" {
		msg = "Transfer ditolak."
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": msg, "data": history})
}

func (h *Handler) GetPendingTransfers(c *gin.Context) {
	ownerIDStr, _ := c.Get("user_id")
	ownerID, err := uuid.Parse(ownerIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca identitas pemilik"})
		return
	}

	histories, err := h.service.GetPendingTransfers(ownerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil daftar transfer"})
		return
	}

	if histories == nil {
		histories = []models.TransferHistory{}
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": histories})
}

func (h *Handler) GetTransferByInviteToken(c *gin.Context) {
	token := c.Param("token")

	history, product, err := h.service.GetTransferByInviteToken(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"product_name": product.Name,
			"from_owner":   history.FromOwner,
			"invite_token": token,
		},
	})
}

func (h *Handler) AcceptTransferWithRegister(c *gin.Context) {
	var req struct {
		InviteToken string `json:"invite_token" binding:"required"`
		Name        string `json:"name" binding:"required"`
		Username    string `json:"username" binding:"required"`
		Password    string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Semua field wajib diisi"})
		return
	}

	history, accessToken, refreshToken, userID, userName, userUsername, err := h.service.AcceptTransferWithRegister(AcceptWithRegisterInput{
		InviteToken: req.InviteToken,
		Name:        req.Name,
		Username:    req.Username,
		Password:    req.Password,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Akun berhasil dibuat dan transfer diterima!",
		"data": gin.H{
			"transfer":      history,
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"user_id":       userID,
			"name":          userName,
			"username":      userUsername,
		},
	})
}
