"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRightLeft, PlusCircle, History, QrCode, ShieldCheck, Database, UserCheck, Activity, Search, Download, ImagePlus, Edit3 } from "lucide-react";
import QRCode from "react-qr-code";
import Link from "next/link";
import { toast } from "sonner";

const ScrollAnimate = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
    {children}
  </motion.div>
);

const convertToBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string); 
    reader.onerror = (error) => reject(error);
  });
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"register" | "edit" | "transfer" | "history">("register");
  const [stats, setStats] = useState({ total_products: 0, total_claimed: 0, total_transfers: 0 });

  const [formData, setFormData] = useState({ name: "", artisan: "", origin: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);

  const [editSearch, setEditSearch] = useState("");
  const [editStatus, setEditStatus] = useState<"idle" | "loading" | "found" | "not_found" | "saving">("idle");
  const [editData, setEditData] = useState({ uuid: "", name: "", artisan: "", origin: "", description: "", image_url: "" });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const [transferData, setTransferData] = useState({ uuid: "", newOwner: "" });
  const [transferStatus, setTransferStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [historySearch, setHistorySearch] = useState("");
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"idle" | "loading" | "success" | "error" | "not_found">("idle");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/stats");
        const json = await res.json();
        if (res.ok) setStats(json.data);
      } catch (error) { console.error("Gagal memuat statistik"); }
    };
    fetchStats();
  }, [status, transferStatus, editStatus]); 

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "register" | "edit") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === "register") {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setEditImageFile(file);
        setEditImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setQrCode(null);
    try {
      let imageUrl = "";
      
      if (imageFile) {
        toast.loading("Memproses foto ke Database...", { id: "upload" });
        imageUrl = await convertToBase64(imageFile);
        toast.dismiss("upload");
      }

      const res = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image_url: imageUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setQrCode(data.data.qr_code);
        setFormData({ name: "", artisan: "", origin: "", description: "" });
        setImageFile(null); setImagePreview(null);
        toast.success("Wastra berhasil diamankan di Blockchain!");
      } else {
        setStatus("error");
        toast.error("Gagal mendaftarkan Wastra.");
      }
    } catch (error) {
      setStatus("error");
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleSearchEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSearch) return;
    setEditStatus("loading");
    try {
      const res = await fetch(`http://localhost:8080/api/products/scan/${editSearch}`);
      const json = await res.json();
      if (res.ok) {
        setEditData({
          uuid: json.data.qr_code,
          name: json.data.name,
          artisan: json.data.artisan,
          origin: json.data.origin,
          description: json.data.description,
          image_url: json.data.image_url
        });
        setEditImagePreview(json.data.image_url);
        setEditStatus("found");
        toast.success("Data Wastra ditemukan!");
      } else {
        setEditStatus("not_found");
        toast.error("UUID tidak ditemukan.");
      }
    } catch (error) {
      setEditStatus("error");
      toast.error("Gagal mencari data.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditStatus("saving");
    try {
      let imageUrl = editData.image_url;
      
      if (editImageFile) {
        toast.loading("Menyimpan foto baru...", { id: "edit_upload" });
        imageUrl = await convertToBase64(editImageFile);
        toast.dismiss("edit_upload");
      }

      const res = await fetch(`http://localhost:8080/api/products/edit/${editData.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          artisan: editData.artisan,
          origin: editData.origin,
          description: editData.description,
          image_url: imageUrl
        }),
      });

      if (res.ok) {
        setEditStatus("idle");
        setEditSearch("");
        setEditImageFile(null);
        toast.success("Data Wastra berhasil diperbarui!");
      } else {
        setEditStatus("found");
        toast.error("Gagal memperbarui data.");
      }
    } catch (error) {
      setEditStatus("found");
      toast.error("Kesalahan jaringan saat menyimpan.");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferStatus("loading");
    try {
      const res = await fetch(`http://localhost:8080/api/products/transfer/${transferData.uuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_owner_name: transferData.newOwner }),
      });
      if (res.ok) {
        setTransferStatus("success");
        setTransferData({ uuid: "", newOwner: "" });
        toast.success("Kepemilikan berhasil ditransfer!");
      } else {
        setTransferStatus("error");
        toast.error("Gagal transfer! UUID mungkin salah.");
      }
    } catch (error) { setTransferStatus("error"); toast.error("Terjadi kesalahan jaringan."); }
  };

  const handleSearchHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historySearch) return;
    setHistoryStatus("loading");
    try {
      const res = await fetch(`http://localhost:8080/api/products/history/${historySearch}`);
      const json = await res.json();
      if (res.ok) {
        setHistoryList(json.data || []);
        setHistoryStatus("success");
        toast.success("Jejak wastra ditemukan!");
      } else {
        setHistoryStatus("not_found");
        toast.error("UUID tidak ditemukan di sistem.");
      }
    } catch (error) { setHistoryStatus("error"); toast.error("Terjadi kesalahan jaringan."); }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#4A2E1B] font-sans pb-20 relative">
      
      <header className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <ScrollAnimate>
          <Link href="/" className="text-2xl font-serif font-bold tracking-tighter">
            KriyaChain<span className="text-[#4A2E1B]/40">.Admin</span>
          </Link>
        </ScrollAnimate>
        <ScrollAnimate delay={0.1}>
          <div className="flex gap-2 bg-[#4A2E1B]/5 p-1 rounded-2xl border border-[#4A2E1B]/10 backdrop-blur-sm overflow-x-auto max-w-full">
            {[
              { id: "register", icon: PlusCircle, label: "Registrasi" },
              { id: "edit", icon: Edit3, label: "Edit" },
              { id: "transfer", icon: ArrowRightLeft, label: "Transfer" },
              { id: "history", icon: History, label: "Jejak" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id ? "bg-[#4A2E1B] text-white shadow-lg" : "text-[#4A2E1B]/50 hover:text-[#4A2E1B]"
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden md:block uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
        </ScrollAnimate>
      </header>

      <main className="max-w-4xl mx-auto px-6 mt-4 relative z-10">
        
        
        <ScrollAnimate delay={0.2}>
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#4A2E1B]">Overview Sistem</h2>
            </div>
            <a href="http://localhost:8080/api/products/export" className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl text-xs font-bold hover:bg-green-800 transition-all shadow-lg shadow-green-700/20 active:scale-95">
              <Download size={14} /> Ekspor CSV
            </a>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-[#4A2E1B]/10 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-[#4A2E1B]/5 rounded-2xl text-[#4A2E1B]"><Database size={24} /></div>
              <div><p className="text-[10px] font-bold text-[#4A2E1B]/50 uppercase tracking-widest mb-1">Total Wastra</p><p className="text-3xl font-serif font-bold text-[#4A2E1B] leading-none">{stats.total_products}</p></div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-[#4A2E1B]/10 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-green-50 rounded-2xl text-green-700"><UserCheck size={24} /></div>
              <div><p className="text-[10px] font-bold text-[#4A2E1B]/50 uppercase tracking-widest mb-1">Telah Dimiliki</p><p className="text-3xl font-serif font-bold text-green-700 leading-none">{stats.total_claimed}</p></div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-[#4A2E1B]/10 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-700"><Activity size={24} /></div>
              <div><p className="text-[10px] font-bold text-[#4A2E1B]/50 uppercase tracking-widest mb-1">Jejak Transfer</p><p className="text-3xl font-serif font-bold text-amber-700 leading-none">{stats.total_transfers}</p></div>
            </div>
          </div>
        </ScrollAnimate>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            
            
            {activeTab === "register" && (
              <motion.div key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <section className="bg-white/80 backdrop-blur-md border border-[#4A2E1B]/10 p-8 rounded-3xl shadow-xl shadow-[#4A2E1B]/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#4A2E1B] rounded-full flex items-center justify-center text-white"><QrCode size={20} /></div>
                    <div><h2 className="text-xl font-serif font-bold">Wastra Baru</h2><p className="text-xs text-[#4A2E1B]/50">Daftarkan identitas digital wastra beserta fotonya</p></div>
                  </div>
                  <form onSubmit={handleRegister} className="space-y-5">
                    
                    
                    <div>
                      <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Foto Wastra (Opsional)</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#4A2E1B]/20 border-dashed rounded-xl cursor-pointer bg-white/50 hover:bg-white/80 transition-colors overflow-hidden relative">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImagePlus className="w-8 h-8 mb-2 text-[#4A2E1B]/50" />
                            <p className="text-xs text-[#4A2E1B]/50 font-medium">Klik untuk unggah foto</p>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "register")} />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Nama Wastra</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl focus:ring-2 focus:ring-[#4A2E1B]/20 outline-none text-sm" placeholder="misal: Batik Parang" /></div>
                      <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Asal Daerah</label><input type="text" required value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="w-full px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl focus:ring-2 focus:ring-[#4A2E1B]/20 outline-none text-sm" placeholder="misal: Pekalongan" /></div>
                    </div>
                    <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Nama Pengrajin</label><input type="text" required value={formData.artisan} onChange={(e) => setFormData({ ...formData, artisan: e.target.value })} className="w-full px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl focus:ring-2 focus:ring-[#4A2E1B]/20 outline-none text-sm" placeholder="Nama seniman pembuat" /></div>
                    <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Filosofi & Cerita</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl focus:ring-2 focus:ring-[#4A2E1B]/20 outline-none text-sm resize-none" placeholder="Ceritakan makna dibalik motif ini..." /></div>
                    
                    <button type="submit" disabled={status === "loading"} className="w-full bg-[#4A2E1B] text-white font-bold py-4 rounded-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                      {status === "loading" ? "Mendaftarkan..." : <><PlusCircle size={18} /> Daftarkan ke Blockchain</>}
                    </button>
                  </form>

                  {status === "success" && qrCode && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-green-50 border border-green-100 rounded-2xl flex flex-col items-center">
                      <ShieldCheck className="text-green-600 mb-2" size={32} />
                      <p className="text-sm font-bold text-green-800 mb-4 text-center">Wastra Berhasil Disertifikasi!</p>
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-green-200 flex flex-col items-center">
                        <div className="p-2 bg-white rounded-lg border border-[#4A2E1B]/10"><QRCode value={qrCode} size={160} bgColor="#ffffff" fgColor="#4A2E1B" level="Q" /></div>
                        <p className="font-mono text-[10px] text-[#4A2E1B]/50 mt-4 break-all text-center">{qrCode}</p>
                      </div>
                    </motion.div>
                  )}
                </section>
              </motion.div>
            )}

            
            {activeTab === "edit" && (
              <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <section className="bg-white/80 backdrop-blur-md border border-[#4A2E1B]/10 p-8 rounded-3xl shadow-xl shadow-[#4A2E1B]/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#4A2E1B] rounded-full flex items-center justify-center text-white"><Edit3 size={20} /></div>
                    <div><h2 className="text-xl font-serif font-bold">Edit Metadata</h2><p className="text-xs text-[#4A2E1B]/50">Perbarui info atau foto wastra (kecuali kepemilikan)</p></div>
                  </div>

                  {editStatus === "idle" || editStatus === "loading" || editStatus === "not_found" || editStatus === "error" ? (
                    <form onSubmit={handleSearchEdit} className="flex gap-2">
                      <input type="text" required value={editSearch} onChange={(e) => setEditSearch(e.target.value)} placeholder="Masukkan UUID Wastra..." className="flex-1 px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#4A2E1B]/20" />
                      <button type="submit" disabled={editStatus === "loading"} className="px-6 py-3 bg-[#4A2E1B] text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50">
                        {editStatus === "loading" ? "Mencari..." : "Cari"}
                      </button>
                    </form>
                  ) : (
                    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSaveEdit} className="space-y-5">
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">Mode Edit Aktif</span>
                        <button type="button" onClick={() => setEditStatus("idle")} className="text-xs font-bold text-[#4A2E1B]/50 hover:text-[#4A2E1B]">Batal</button>
                      </div>

                      
                      <div>
                        <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Ubah Foto</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#4A2E1B]/20 border-dashed rounded-xl cursor-pointer bg-white/50 hover:bg-white/80 transition-colors overflow-hidden relative">
                          {editImagePreview ? (
                            <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <ImagePlus className="w-8 h-8 mb-2 text-[#4A2E1B]/50" />
                              <p className="text-xs text-[#4A2E1B]/50 font-medium">Klik untuk ganti foto</p>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, "edit")} />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Nama Wastra</label><input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#4A2E1B]/20 rounded-xl text-sm outline-none" /></div>
                        <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Asal Daerah</label><input type="text" required value={editData.origin} onChange={(e) => setEditData({ ...editData, origin: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#4A2E1B]/20 rounded-xl text-sm outline-none" /></div>
                      </div>
                      <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Nama Pengrajin</label><input type="text" required value={editData.artisan} onChange={(e) => setEditData({ ...editData, artisan: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#4A2E1B]/20 rounded-xl text-sm outline-none" /></div>
                      <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Filosofi & Cerita</label><textarea rows={3} value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full px-4 py-3 bg-white border border-[#4A2E1B]/20 rounded-xl text-sm outline-none resize-none" /></div>
                      
                      <button type="submit" disabled={editStatus === "saving"} className="w-full bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                        {editStatus === "saving" ? "Menyimpan Perubahan..." : "Simpan Pembaruan"}
                      </button>
                    </motion.form>
                  )}
                </section>
              </motion.div>
            )}

            
            {activeTab === "transfer" && (
              <motion.div key="transfer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <section className="bg-white/80 backdrop-blur-md border border-[#4A2E1B]/10 p-8 rounded-3xl shadow-xl shadow-[#4A2E1B]/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#4A2E1B] rounded-full flex items-center justify-center text-white"><ArrowRightLeft size={20} /></div>
                    <div><h2 className="text-xl font-serif font-bold">Transfer Kepemilikan</h2><p className="text-xs text-[#4A2E1B]/50">Sahkan perpindahan tangan koleksi</p></div>
                  </div>
                  <form onSubmit={handleTransfer} className="space-y-5">
                    <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">UUID Wastra</label><input type="text" required value={transferData.uuid} onChange={(e) => setTransferData({ ...transferData, uuid: e.target.value })} className="w-full px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-[#4A2E1B]/20" placeholder="Paste UUID dari QR scan..." /></div>
                    <div><label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-[0.2em] mb-2">Pemilik Baru</label><input type="text" required value={transferData.newOwner} onChange={(e) => setTransferData({ ...transferData, newOwner: e.target.value })} className="w-full px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4A2E1B]/20" placeholder="Nama pembeli / kolektor baru" /></div>
                    <button type="submit" disabled={transferStatus === "loading"} className="w-full bg-[#4A2E1B] text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50">
                      {transferStatus === "loading" ? "Mengesahkan..." : "Sahkan Perpindahan"}
                    </button>
                  </form>
                </section>
              </motion.div>
            )}

            
            {activeTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                <section className="bg-white/80 backdrop-blur-md border border-[#4A2E1B]/10 p-8 rounded-3xl shadow-xl shadow-[#4A2E1B]/5 min-h-[400px]">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#4A2E1B] rounded-full flex items-center justify-center text-white"><History size={20} /></div>
                    <div><h2 className="text-xl font-serif font-bold">Provenance Tracking</h2><p className="text-xs text-[#4A2E1B]/50">Lacak riwayat perjalanan wastra secara transparan</p></div>
                  </div>
                  <form onSubmit={handleSearchHistory} className="flex gap-2 mb-8">
                    <input type="text" value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Masukkan UUID Wastra..." className="flex-1 px-4 py-3 bg-white/50 border border-[#4A2E1B]/10 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#4A2E1B]/20 outline-none" required />
                    <button type="submit" disabled={historyStatus === "loading"} className="px-6 py-3 bg-[#4A2E1B] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#3A2214] disabled:opacity-50 flex items-center gap-2">
                      <Search size={14} /> {historyStatus === "loading" ? "Mencari" : "Lacak"}
                    </button>
                  </form>
                  <div className="min-h-[200px]">
                    {historyStatus === "idle" && <div className="text-center py-12 text-[#4A2E1B]/40 text-sm">Masukkan UUID wastra untuk melihat riwayat perjalanannya.</div>}
                    {historyStatus === "success" && (
                      <div className="space-y-6">
                        {historyList.length > 0 ? (
                          <div className="relative border-l-2 border-[#4A2E1B]/20 ml-4 space-y-6 py-4">
                            {historyList.map((hist, idx) => (
                              <div key={idx} className="relative pl-8">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-[#4A2E1B] border-4 border-white shadow-sm"></div>
                                <p className="text-[10px] font-bold text-[#4A2E1B]/50 mb-0.5 uppercase tracking-widest">{new Date(hist.transfer_date).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-sm font-bold text-[#4A2E1B]"><span className="opacity-60 font-medium">Dari:</span> {hist.from_owner} <span className="mx-2 opacity-30">➔</span> <span className="opacity-60 font-medium">Ke:</span> {hist.to_owner}</p>
                              </div>
                            ))}
                          </div>
                        ) : <div className="text-center py-12 text-[#4A2E1B]/60 text-sm font-medium bg-[#4A2E1B]/5 rounded-2xl border border-[#4A2E1B]/10">Wastra ini belum pernah ditransfer.</div>}
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%234A2E1B' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundPosition: 'center' }}></div>
    </div>
  );
}