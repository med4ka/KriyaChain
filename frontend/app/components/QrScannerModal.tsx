"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Search, UserCheck, Sparkles, MapPin, Milestone, QrCode, Download, Image as ImageIcon, Volume2, VolumeX, Share2, Compass, KeyRound, User, Lock, Mail } from "lucide-react";
import { useState, useRef } from "react";
import { Scanner } from '@yudiel/react-qr-scanner';
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { apiUrl } from "../lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ClaimMode = "register" | "login" | "claimed";
type OwnerAuthMode = "idle" | "register" | "login";

export default function QrScannerModal({ isOpen, onClose }: Props) {
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [wastraData, setWastraData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"story" | "history">("story");
  const [claimCode, setClaimCode] = useState("");
  const [claimStatus, setClaimStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [claimMode, setClaimMode] = useState<ClaimMode>("register");
  const [ownerAuthMode, setOwnerAuthMode] = useState<OwnerAuthMode>("idle");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ name: "", username: "", password: "" });

  const [inviteMode, setInviteMode] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  const certificateRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `Sertifikat-KriyaChain-${wastraData?.name}`,
  });

  const isOwnerLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem("owner_token");

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    } else {
      toast.error("Browser Anda belum mendukung fitur suara.");
    }
  };

  const handleShare = async () => {
    if (navigator.share && wastraData) {
      try {
        await navigator.share({
          title: `Mahakarya KriyaChain: ${wastraData.name}`,
          text: `Lihat mahakarya ${wastraData.name} karya ${wastraData.artisan} yang terverifikasi di KriyaChain!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share dibatalkan", error);
      }
    } else {
      toast.info("Browser Anda tidak mendukung fitur Bagikan.");
    }
  };

  const saveToCollection = (data: any) => {
    const saved = localStorage.getItem('kriyachain_collection');
    const collection = saved ? JSON.parse(saved) : [];
    if (!collection.find((item: any) => item.qr_code === data.qr_code)) {
      collection.push(data);
      localStorage.setItem('kriyachain_collection', JSON.stringify(collection));
      toast.success("Wastra tersimpan di Lemari Koleksi!");
    }
  };

  const handleCloseModal = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setOwnerAuthMode("idle");
    setOwnerForm({ name: "", username: "", password: "" });
    setInviteMode(false);
    setInviteData(null);
    setClaimCode("");
    setClaimStatus("idle");
    onClose();
  };

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode) return;
    setStatus("loading"); setClaimStatus("idle"); setClaimMode("register"); setOwnerAuthMode("idle");

    if (manualCode.length === 32) {
      try {
        const inviteRes = await fetch(apiUrl(`/api/transfers/invite/${manualCode}`));
        const inviteJson = await inviteRes.json();
        if (inviteRes.ok) {
          setInviteMode(true);
          setInviteData(inviteJson.data);
          setStatus("success");
          return;
        }
      } catch {}
    }

    try {
      const res = await fetch(apiUrl(`/api/products/scan/${manualCode}`));
      const data = await res.json();
      if (res.ok) {
        setWastraData(data.data);
        saveToCollection(data.data);
        setStatus("success");
        if (data.data.is_claimed) {
          setClaimMode("claimed");
        } else if (isOwnerLoggedIn) {
          setOwnerAuthMode("idle");
        } else {
          setOwnerAuthMode("register");
        }
        try {
          const historyRes = await fetch(apiUrl(`/api/products/history/${manualCode}`));
          const historyJson = await historyRes.json();
          if (historyRes.ok) setHistoryData(historyJson.data || []);
        } catch (error) { console.error("Gagal load history", error); }
      } else { setStatus("error"); }
    } catch (error) { setStatus("error"); }
  };

  const handleClaimWithAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimCode || !wastraData) return;
    setClaimStatus("loading");

    try {
      let token: string | null = localStorage.getItem("owner_token");

      if (ownerAuthMode === "register" || ownerAuthMode === "login") {
        if (ownerAuthMode === "register") {
          if (!ownerForm.name || !ownerForm.username || !ownerForm.password) {
            toast.error("Nama, username, dan password wajib diisi");
            setClaimStatus("error");
            return;
          }
          const regRes = await fetch(apiUrl("/api/auth/owner/register"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ownerForm),
          });
          const regData = await regRes.json();
          if (!regRes.ok) {
            toast.error(regData.message || "Gagal daftar akun");
            setClaimStatus("error");
            return;
          }
          const newToken = regData.data.access_token;
          localStorage.setItem("owner_token", newToken);
          token = newToken;
        } else {
          if (!ownerForm.username || !ownerForm.password) {
            toast.error("Username dan password wajib diisi");
            setClaimStatus("error");
            return;
          }
          const loginRes = await fetch(apiUrl("/api/auth/owner/login"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: ownerForm.username, password: ownerForm.password }),
          });
          const loginData = await loginRes.json();
          if (!loginRes.ok) {
            toast.error(loginData.message || "Gagal login");
            setClaimStatus("error");
            return;
          }
          const loginToken = loginData.data.access_token;
          localStorage.setItem("owner_token", loginToken);
          token = loginToken;
        }
      }

      if (!token) {
        toast.error("Silakan login terlebih dahulu");
        setClaimStatus("error");
        return;
      }
      const res = await fetch(apiUrl(`/api/products/claim/${wastraData.qr_code}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ claim_code: claimCode }),
      });
      if (res.ok) {
        setClaimStatus("success");
        setClaimMode("claimed");
        setWastraData({ ...wastraData, is_claimed: true, owner_name: ownerForm.name || "Anda" });
        const historyRes = await fetch(apiUrl(`/api/products/history/${wastraData.qr_code}`));
        const historyJson = await historyRes.json();
        if (historyRes.ok) setHistoryData(historyJson.data || []);
        toast.success("Selamat! Wastra resmi menjadi milik Anda.");
      } else {
        const errData = await res.json();
        setClaimStatus("error");
        toast.error(errData.message || "Klaim gagal! Periksa kode klaim.");
      }
    } catch (error) {
      setClaimStatus("error");
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData || !ownerForm.name || !ownerForm.username || !ownerForm.password) {
      toast.error("Nama, username, dan password wajib diisi");
      return;
    }
    setClaimStatus("loading");
    try {
      const res = await fetch(apiUrl("/api/transfers/accept-with-register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_token: manualCode,
          name: ownerForm.name,
          username: ownerForm.username,
          password: ownerForm.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("owner_token", data.data.access_token);
        setClaimStatus("success");
        toast.success("Akun berhasil dibuat! Transfer diterima.");
        setTimeout(() => handleCloseModal(), 2000);
      } else {
        setClaimStatus("error");
        toast.error(data.message || "Gagal menerima undangan");
      }
    } catch {
      setClaimStatus("error");
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="qr-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="absolute inset-0 bg-[#4A2E1B]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#F8F7F4] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="bg-[#4A2E1B] p-6 text-white text-center relative shrink-0">
                <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={18} /></button>
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                  {inviteMode ? <UserCheck size={32} className="text-amber-100" /> : <Camera size={32} className="text-amber-100" />}
                </div>
                <h3 className="text-xl font-serif font-bold">{inviteMode ? "Undangan Transfer" : "Verifikasi Wastra"}</h3>
                <p className="text-white/60 text-xs mt-1">
                  {inviteMode ? "Buat akun untuk menerima wastra" : "Pindai QR Code fisik untuk melacak jejak"}
                </p>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {status === "idle" || status === "error" ? (
                  <div className="flex flex-col gap-4">
                    {status === "error" && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 text-center font-medium">UUID atau token tidak ditemukan.</div>}
                    <div className="flex bg-[#4A2E1B]/5 rounded-xl p-1 mb-2">
                      <button type="button" onClick={() => setIsCameraActive(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${!isCameraActive ? "bg-white text-[#4A2E1B] shadow-sm" : "text-[#4A2E1B]/50 hover:text-[#4A2E1B]"}`}><Search size={14} /> Ketik Manual</button>
                      <button type="button" onClick={() => setIsCameraActive(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${isCameraActive ? "bg-white text-[#4A2E1B] shadow-sm" : "text-[#4A2E1B]/50 hover:text-[#4A2E1B]"}`}><QrCode size={14} /> Kamera Scanner</button>
                    </div>
                    {isCameraActive ? (
                      <div className="rounded-2xl overflow-hidden border-2 border-[#4A2E1B]/20 bg-black/5 aspect-square relative flex items-center justify-center shadow-inner">
                        <Scanner onScan={(result) => { if (result && result.length > 0) { setManualCode(result[0].rawValue); setIsCameraActive(false); } }} formats={['qr_code']} />
                        <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none"><p className="text-white bg-black/50 px-3 py-1 rounded-full text-[10px] inline-block backdrop-blur-md">Arahkan kamera ke QR Code Wastra</p></div>
                      </div>
                    ) : (
                      <form onSubmit={handleScan} className="flex flex-col gap-4">
                        <input type="text" required placeholder="UUID / Token Undangan" value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 font-mono text-center text-sm shadow-inner" />
                        <button type="submit" className="w-full py-3 bg-[#4A2E1B] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#3A2214] transition-all active:scale-95 shadow-lg shadow-[#4A2E1B]/20"><Search size={18} /> Cek Keaslian</button>
                      </form>
                    )}
                  </div>
                ) : status === "loading" ? (
                  <div className="py-12 flex flex-col items-center justify-center text-[#4A2E1B]"><div className="w-10 h-10 border-4 border-[#4A2E1B]/20 border-t-[#4A2E1B] rounded-full animate-spin mb-4" /><p className="text-sm font-bold animate-pulse">Memverifikasi Blockchain...</p></div>
                ) : inviteMode && inviteData ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserCheck size={28} className="text-amber-700" />
                      </div>
                      <h4 className="text-lg font-serif font-bold text-[#4A2E1B] mb-2">Undangan Transfer</h4>
                      <p className="text-sm text-[#4A2E1B]/70">
                        <span className="font-bold">{inviteData.from_owner}</span> mengirimkan wastra <span className="font-bold">{inviteData.product_name}</span> kepada Anda
                      </p>
                    </div>

                    <div className="bg-white rounded-xl border border-[#4A2E1B]/10 p-5">
                      <h5 className="text-xs font-bold text-[#4A2E1B] uppercase tracking-wider mb-4 text-center">Buat Akun & Terima</h5>
                      <form onSubmit={handleAcceptInvite} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-widest mb-1">Nama</label>
                          <div className="flex items-center gap-2 bg-[#F8F7F4] border border-[#4A2E1B]/10 rounded-xl px-3">
                            <User size={16} className="text-[#4A2E1B]/30" />
                            <input type="text" required value={ownerForm.name} onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })} className="w-full py-3 bg-transparent outline-none text-sm" placeholder="Nama lengkap" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-widest mb-1">Username</label>
                          <div className="flex items-center gap-2 bg-[#F8F7F4] border border-[#4A2E1B]/10 rounded-xl px-3">
                            <Mail size={16} className="text-[#4A2E1B]/30" />
                            <input type="text" required value={ownerForm.username} onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value })} className="w-full py-3 bg-transparent outline-none text-sm" placeholder="username" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-widest mb-1">Password</label>
                          <div className="flex items-center gap-2 bg-[#F8F7F4] border border-[#4A2E1B]/10 rounded-xl px-3">
                            <Lock size={16} className="text-[#4A2E1B]/30" />
                            <input type="password" required value={ownerForm.password} onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })} className="w-full py-3 bg-transparent outline-none text-sm" placeholder="Min. 6 karakter" />
                          </div>
                        </div>
                        <button type="submit" disabled={claimStatus === "loading"} className="w-full py-3 bg-[#4A2E1B] text-white rounded-xl font-bold hover:bg-[#3A2214] transition-all disabled:opacity-50">
                          {claimStatus === "loading" ? "Memproses..." : "Buat Akun & Terima Transfer"}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {wastraData.image_url ? (
                      <div className="w-full h-48 rounded-2xl overflow-hidden border border-[#4A2E1B]/10 shadow-inner">
                        <img src={wastraData.image_url} alt={wastraData.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-[#4A2E1B]/5 rounded-2xl border border-[#4A2E1B]/10 flex items-center justify-center text-[#4A2E1B]/30">
                        <ImageIcon size={32} />
                      </div>
                    )}

                    <div className="text-center">
                      <h4 className="text-2xl font-serif font-bold text-[#4A2E1B] mb-1">{wastraData.name}</h4>
                      <p className="text-sm text-[#4A2E1B]/70 font-medium">Karya: {wastraData.artisan}</p>
                      {wastraData.origin && <p className="text-xs text-[#4A2E1B]/50 flex items-center justify-center gap-1 mt-2"><MapPin size={12} /> {wastraData.origin}</p>}
                    </div>

                    <div className="flex bg-[#4A2E1B]/5 rounded-xl p-1">
                      <button onClick={() => setActiveView("story")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeView === "story" ? "bg-white text-[#4A2E1B] shadow-sm" : "text-[#4A2E1B]/50 hover:text-[#4A2E1B]"}`}><Sparkles size={14} /> Filosofi</button>
                      <button onClick={() => setActiveView("history")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeView === "history" ? "bg-white text-[#4A2E1B] shadow-sm" : "text-[#4A2E1B]/50 hover:text-[#4A2E1B]"}`}><Milestone size={14} /> Jejak</button>
                    </div>

                    <div className="bg-white rounded-xl border border-[#4A2E1B]/10 p-5 min-h-[160px] max-h-[300px] overflow-y-auto custom-scrollbar">
                      {activeView === "story" ? (
                        <div className="relative">
                          <button
                            onClick={() => handleSpeak(wastraData?.description || "Belum ada catatan filosofi.")}
                            className={`absolute top-0 right-0 p-2 rounded-full transition-all ${isSpeaking ? "bg-amber-100 text-amber-700 animate-pulse shadow-sm" : "bg-[#4A2E1B]/5 text-[#4A2E1B]/50 hover:bg-[#4A2E1B]/10 hover:text-[#4A2E1B]"}`}
                            title={isSpeaking ? "Hentikan Suara" : "Dengarkan Cerita"}
                          >
                            {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                          </button>
                          <p className="text-sm text-[#4A2E1B]/80 leading-relaxed italic text-center pr-8 pt-2">
                            {wastraData?.description ? `"${wastraData.description}"` : "Belum ada catatan filosofi untuk wastra ini."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="relative w-full h-32 bg-[#4A2E1B] rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                            <div className="absolute w-12 h-12 bg-amber-400/30 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                            <div className="absolute w-24 h-24 bg-amber-400/20 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                            <div className="absolute w-36 h-36 bg-amber-400/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                            <div className="relative z-10 flex flex-col items-center mt-2">
                              <div className="bg-[#F8F7F4] p-2 rounded-full mb-1 shadow-lg shadow-black/40 border border-amber-900/20">
                                <Compass size={20} className="text-amber-700 animate-[spin_4s_linear_infinite]" />
                              </div>
                              <p className="text-[#F8F7F4] font-serif font-bold text-lg drop-shadow-md tracking-wide">
                                {wastraData?.origin || "Nusantara"}
                              </p>
                              <p className="text-white/60 text-[9px] tracking-[0.2em] uppercase mt-1 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                Titik Nol Penciptaan
                              </p>
                            </div>
                          </div>

                          <div className="relative border-l-2 border-[#4A2E1B]/10 ml-3 space-y-6 pt-2">
                            {historyData.length > 0 && historyData.map((hist, idx) => (
                              <div key={idx} className="relative pl-6">
                                <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-[#4A2E1B] border-2 border-white shadow-sm" />
                                <p className="text-[10px] font-bold text-[#4A2E1B]/50 mb-0.5">{new Date(hist.transfer_date).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xs text-[#4A2E1B]"><span className="font-semibold">{hist.from_owner}</span> ➔ <span className="font-semibold">{hist.to_owner}</span></p>
                              </div>
                            ))}
                            <div className="relative pl-6 opacity-60">
                              <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-stone-300 border-2 border-white shadow-sm" />
                              <p className="text-[10px] font-bold text-[#4A2E1B]/50 mb-0.5">Kelahiran Mahakarya</p>
                              <p className="text-xs text-[#4A2E1B]">Didaftarkan oleh <span className="font-semibold">{wastraData.artisan}</span></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#4A2E1B]/10 pb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck size={16} className="text-[#4A2E1B]" />
                        <h5 className="text-xs font-bold text-[#4A2E1B] uppercase tracking-wider">Status Kepemilikan</h5>
                      </div>

                      {claimMode === "claimed" || wastraData.is_claimed ? (
                        <div className="flex flex-col gap-3">
                          <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 text-xs font-medium text-center">
                            Dimiliki oleh: <span className="font-bold">{wastraData.owner_name}</span>
                          </div>
                          <button onClick={() => handlePrint()} className="w-full py-2 bg-amber-100/50 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-amber-200">
                            <Download size={14} /> Unduh Sertifikat Keaslian
                          </button>
                          <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-[#4A2E1B]/5 hover:bg-[#4A2E1B]/10 text-[#4A2E1B] px-4 py-2 rounded-xl font-bold transition-all text-xs border border-[#4A2E1B]/10">
                            <Share2 size={14} /> Bagikan
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleClaimWithAuth} className="space-y-3">
                          {ownerAuthMode === "register" && (
                            <>
                              <div className="flex gap-2">
                                <User size={16} className="text-[#4A2E1B]/40 self-center" />
                                <input type="text" required value={ownerForm.name} onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })} className="flex-1 px-4 py-2 bg-[#F8F7F4] border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 text-xs" placeholder="Nama lengkap" />
                              </div>
                              <div className="flex gap-2">
                                <Mail size={16} className="text-[#4A2E1B]/40 self-center" />
                                <input type="text" required value={ownerForm.username} onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value })} className="flex-1 px-4 py-2 bg-[#F8F7F4] border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 text-xs" placeholder="Username" />
                              </div>
                              <div className="flex gap-2">
                                <Lock size={16} className="text-[#4A2E1B]/40 self-center" />
                                <input type="password" required value={ownerForm.password} onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })} className="flex-1 px-4 py-2 bg-[#F8F7F4] border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 text-xs" placeholder="Password" />
                              </div>
                              <p className="text-[10px] text-[#4A2E1B]/40 text-center">
                                Sudah punya akun?{' '}
                                <button type="button" onClick={() => setOwnerAuthMode("login")} className="text-[#4A2E1B] font-bold underline">Login</button>
                              </p>
                            </>
                          )}
                          {ownerAuthMode === "login" && (
                            <>
                              <div className="flex gap-2">
                                <Mail size={16} className="text-[#4A2E1B]/40 self-center" />
                                <input type="text" required value={ownerForm.username} onChange={(e) => setOwnerForm({ ...ownerForm, username: e.target.value })} className="flex-1 px-4 py-2 bg-[#F8F7F4] border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 text-xs" placeholder="Username" />
                              </div>
                              <div className="flex gap-2">
                                <Lock size={16} className="text-[#4A2E1B]/40 self-center" />
                                <input type="password" required value={ownerForm.password} onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })} className="flex-1 px-4 py-2 bg-[#F8F7F4] border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 text-xs" placeholder="Password" />
                              </div>
                              <p className="text-[10px] text-[#4A2E1B]/40 text-center">
                                Belum punya akun?{' '}
                                <button type="button" onClick={() => setOwnerAuthMode("register")} className="text-[#4A2E1B] font-bold underline">Daftar</button>
                              </p>
                            </>
                          )}
                          {ownerAuthMode === "idle" && isOwnerLoggedIn && (
                            <p className="text-[10px] text-green-700 text-center font-bold">Akun owner terhubung</p>
                          )}
                          <div className="flex gap-2">
                            <KeyRound size={16} className="text-[#4A2E1B]/40 self-center" />
                            <input type="text" required placeholder="Kode Klaim (dari pengrajin)..." value={claimCode} onChange={(e) => setClaimCode(e.target.value)} className="flex-1 px-4 py-2 bg-[#F8F7F4] border border-[#4A2E1B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A2E1B]/50 text-xs font-mono tracking-wider" />
                          </div>
                          <button type="submit" disabled={claimStatus === "loading" || !claimCode} className="w-full py-2 bg-[#4A2E1B] text-white rounded-xl text-xs font-bold hover:bg-[#3A2214] transition-colors disabled:opacity-50">
                            {claimStatus === "loading" ? "Memverifikasi..." : ownerAuthMode === "register" ? "Daftar & Klaim Wastra" : ownerAuthMode === "login" ? "Masuk & Klaim Wastra" : "Klaim Wastra"}
                          </button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="hidden">
        <div ref={certificateRef} className="p-12 bg-[#F8F7F4] text-[#4A2E1B] w-[800px] h-[600px] flex flex-col justify-center items-center text-center relative border-[16px] border-[#4A2E1B] m-8 shadow-2xl">
          <div className="absolute inset-4 border border-[#4A2E1B]/30 pointer-events-none"></div>
          <div className="absolute inset-5 border border-[#4A2E1B]/10 pointer-events-none"></div>
          <h1 className="text-5xl font-serif font-bold mb-4 mt-8">Sertifikat Keaslian</h1>
          <p className="text-sm tracking-[0.4em] uppercase text-[#4A2E1B]/50 mb-12 font-bold">KriyaChain Web3 Heritage Tracking</p>
          <p className="text-lg font-light mb-2">Dokumen ini secara resmi menyatakan bahwa mahakarya:</p>
          <h2 className="text-4xl font-serif font-bold text-amber-700 mb-2">{wastraData?.name}</h2>
          <p className="text-md text-[#4A2E1B]/80 mb-8 italic">Diciptakan oleh seniman <span className="font-bold not-italic">{wastraData?.artisan}</span> {wastraData?.origin ? ` dari ${wastraData?.origin}` : ""}</p>
          <p className="text-lg font-light mb-2">Telah terverifikasi di dalam blockchain dan dipegang hak kepemilikannya oleh:</p>
          <h3 className="text-3xl font-serif font-bold mb-12 border-b border-[#4A2E1B]/30 pb-4 px-16 inline-block">{wastraData?.owner_name}</h3>
          <div className="flex justify-between w-full px-12 items-end mt-auto mb-4">
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A2E1B]/50">Digital Signature (UUID)</p>
              <p className="text-xs font-mono font-bold mt-1 text-[#4A2E1B]">{wastraData?.qr_code}</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="p-2 border border-[#4A2E1B]/20 rounded-lg mb-2"><QrCode size={48} className="text-[#4A2E1B] opacity-80" /></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A2E1B]/50">Verified Asset</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}