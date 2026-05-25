<h1 align="center">KriyaChain 🧶</h1>
<p align="center">
  <i>Sistem Verifikasi, Sertifikasi, & Perlindungan Wastra Nusantara Berbasis Web2.5.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Backend-Golang-00ADD8?style=for-the-badge&logo=go" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql" />
</p>

---

## 📌 Project Overview

**KriyaChain** is a hybrid Web2.5 cultural preservation and asset authentication registry designed to protect authentic Indonesian handmade batik (Wastra Nusantara) from the threat of industrial counterfeiting and mass-factory replication[cite: 2, 4]. 

The platform bridges traditional master craftsmanship with modern digital transparency[cite: 4]. By assigning a unique digital identity (UUID) and provenance tracking to every single handmade piece, KriyaChain ensures that the history, the artisan's identity, and the cultural value of the textile are permanently secured and verifiable by anyone, anywhere[cite: 2, 4].

---

## 💡 The Manifesto: Problem & Solution

*   **The Problem:** The ancestral art of handmade batik is fading due to commercial exploitation and rampant industrial forgery[cite: 4]. Mass-produced factory textiles mimic traditional patterns, destroying the livelihoods of local weavers and artisans who spend months on a single piece[cite: 4].
*   **The Solution:** KriyaChain implements a secure digital ledger system[cite: 4]. Every authentic cloth receives a physical-to-digital link via QR codes and unique UUID registry keys, letting buyers scan, study its lineage, and securely claim digital ownership[cite: 2, 4].

---

## ⚡ Core Ecosystem Features

*   Kriya Explorer: A curated digital library showcasing verified masterpieces of Wastra Nusantara, complete with origin sorting (e.g., Pekalongan, Cirebon), artisan details, and real-time ledger verification hashes[cite: 4].
*   Verifikasi Wastra (QR & Manual Scanner): A hybrid verification gateway allowing collectors to scan a textile's physical QR tag via an in-app camera or manually input its unique cryptographic UUID to authenticate its origin[cite: 2, 4].
*   Dynamic Provenance Timeline: A visual timeline tracking the historical evolution of the textile, documenting its creation process, raw material sourcing, and regional historical context[cite: 4].
*   Ownership Claiming Infrastructure: A seamless Web2.5 ownership transition module where verified buyers can claim official digital custody of the physical masterpiece, preventing marketplace duplication[cite: 2, 4].

---

## 📸 Interface Showroom

<table>
  <tr>
    <td align="center"><img src="assets/batik.1.png" width="100%" alt="Nexus Dashboard 1"/></td>
    <td align="center"><img src="assets/batik.2.png" width="100%" alt="Nexus Analytics 2"/></td>
  </tr>
</table>

### 🛡️ The 3-Step Protection Protocol
1. Registrasi Karya ───> 2. Pindai & Pelajari ───> 3. Klaim Kepemilikan
(Artisan Logging)          (Consumer Scanning)       (Securing Identity)


### Frontend Installation

* ** cd frontend
* ** npm install
* ** npm run dev

Backend Installation

* ** cd backend
* ** go mod download
* ** go run main.go
