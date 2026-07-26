"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiUrl } from "../../lib/api";

export default function ArtisanAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/artisan/login" : "/api/auth/artisan/register";
      const body: Record<string, string> = { username: form.username, password: form.password };
      if (mode === "register") body.name = form.name;

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.data.access_token);
        toast.success(mode === "login" ? "Selamat datang kembali!" : "Akun berhasil dibuat!");
        router.push("/admin");
      } else {
        toast.error(data.message || "Gagal memproses");
      }
    } catch {
      toast.error("Koneksi gagal. Pastikan server menyala.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#4A2E1B] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#4A2E1B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold">Portal Pengrajin</h1>
          <p className="text-sm text-[#4A2E1B]/50 mt-1">{mode === "login" ? "Masuk ke akun Anda" : "Daftar sebagai pengrajin"}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-[#4A2E1B]/10 p-6 rounded-3xl shadow-xl">
          <div className="flex bg-[#4A2E1B]/5 rounded-xl p-1 mb-6">
            <button onClick={() => setMode("login")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === "login" ? "bg-white text-[#4A2E1B] shadow-sm" : "text-[#4A2E1B]/50"}`}>Masuk</button>
            <button onClick={() => setMode("register")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === "register" ? "bg-white text-[#4A2E1B] shadow-sm" : "text-[#4A2E1B]/50"}`}>Daftar</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-widest mb-1">Nama</label>
                <div className="flex items-center gap-2 bg-white/50 border border-[#4A2E1B]/10 rounded-xl px-3">
                  <User size={16} className="text-[#4A2E1B]/30" />
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full py-3 bg-transparent outline-none text-sm" placeholder="Nama lengkap" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-widest mb-1">Username</label>
              <div className="flex items-center gap-2 bg-white/50 border border-[#4A2E1B]/10 rounded-xl px-3">
                <Mail size={16} className="text-[#4A2E1B]/30" />
                <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full py-3 bg-transparent outline-none text-sm" placeholder="username" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4A2E1B]/40 uppercase tracking-widest mb-1">Password</label>
              <div className="flex items-center gap-2 bg-white/50 border border-[#4A2E1B]/10 rounded-xl px-3">
                <Lock size={16} className="text-[#4A2E1B]/30" />
                <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full py-3 bg-transparent outline-none text-sm" placeholder="Min. 6 karakter" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-[#4A2E1B] text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? "Memproses..." : <>{mode === "login" ? "Masuk" : "Daftar"} <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#4A2E1B]/40 mt-6">
          <Link href="/" className="hover:text-[#4A2E1B] transition-colors">Kembali ke Beranda</Link>
        </p>
      </motion.div>
    </div>
  );
}
