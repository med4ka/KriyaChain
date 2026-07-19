"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, User, ShieldCheck, ArrowLeft, Sparkles, Image as ImageIcon, Bookmark, Maximize2, X, WifiOff } from "lucide-react";
import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { toast } from "sonner";

// --- KUMPULAN FAKTA & LEGENDA WASTRA ---
const wastraTrivia = [
  "Motif Parang konon melambangkan ombak laut selatan yang tak pernah padam...",
  "Sehelai Batik Tulis halus bisa memakan waktu hingga 6 bulan pembuatan...",
  "Motif Kawung diciptakan oleh Sultan Agung Mataram sebagai simbol kesucian hati...",
  "Kain Tenun Sumba dulunya hanya boleh dikenakan oleh kaum bangsawan...",
  "Kain Ulos selalu mengiringi setiap fase kehidupan suku Batak dari lahir hingga tiada..."
];

export default function ExplorerPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [savedWastra, setSavedWastra] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "collection">("all");
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  // --- STATE UNTUK LOADING TRIVIA ---
  const [triviaIndex, setTriviaIndex] = useState(0);

  // Ganti teks legenda tiap 2.5 detik selama masih loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setTriviaIndex((prev) => (prev + 1) % wastraTrivia.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Sinyal kembali! Aplikasi kembali Online.");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setViewMode("collection"); 
      toast.error("Koneksi terputus! Beralih ke Mode Offline.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setIsOffline(true);
      setViewMode("collection");
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/products");
        const json = await res.json();
        if (res.ok) setProducts(json.data || []);
      } catch (error) {
        console.error("Gagal memuat data galeri, server mungkin mati.", error);
        setIsOffline(true);
        setViewMode("collection");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (navigator.onLine) {
      setTimeout(() => {
        fetchProducts();
      }, 2000); 
    } else {
      setIsLoading(false);
    }

    const saved = localStorage.getItem('kriyachain_collection');
    if (saved) {
      setSavedWastra(JSON.parse(saved));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const dataSource = viewMode === "all" ? products : savedWastra;
  const filteredProducts = dataSource.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.artisan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#4A2E1B] font-sans pb-24 relative">
      
      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="bg-red-600/90 backdrop-blur-md text-white text-xs font-bold py-2.5 px-4 flex items-center justify-center gap-2 z-50 relative shadow-md"
          >
            <WifiOff size={16} className="animate-pulse" /> 
            KONEKSI TERPUTUS: Beroperasi dalam Mode Offline (Hanya menampilkan Lemari Koleksi)
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-[#4A2E1B] text-[#F8F7F4] py-12 px-6 relative overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 text-sm font-medium transition-colors">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">
            Kriya <span className="text-amber-200/90 italic font-light">Explorer.</span>
          </h1>
          <p className="text-white/70 max-w-xl font-light leading-relaxed">
            Pustaka digital seluruh mahakarya Wastra Nusantara yang telah diamankan dan diverifikasi melalui jaringan blockchain KriyaChain.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        
        <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl shadow-[#4A2E1B]/5 border border-[#4A2E1B]/10 flex items-center mb-6 max-w-2xl">
          <div className="pl-4 text-[#4A2E1B]/40"><Search size={20} /></div>
          <input 
            type="text" placeholder="Cari nama wastra atau pengrajin..." 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-transparent outline-none text-[#4A2E1B] placeholder-[#4A2E1B]/40 font-medium"
          />
        </div>

        <div className="flex gap-4 mb-12 mt-2 justify-start max-w-2xl">
          <button 
            onClick={() => setViewMode("all")}
            disabled={isOffline}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "all" ? "bg-[#4A2E1B] text-white shadow-md" : "bg-[#4A2E1B]/5 text-[#4A2E1B]/60 hover:bg-[#4A2E1B]/10"} ${isOffline ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Semua Wastra
          </button>
          <button 
            onClick={() => setViewMode("collection")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${viewMode === "collection" ? "bg-amber-700 text-white shadow-md" : "bg-[#4A2E1B]/5 text-[#4A2E1B]/60 hover:bg-[#4A2E1B]/10"}`}
          >
            <Bookmark size={16} />
            Koleksiku ({savedWastra.length})
          </button>
        </div>

        {isLoading ? (
          
          <div className="flex flex-col items-center justify-center py-24 max-w-xl mx-auto text-center min-h-[40vh]">
            <div className="relative w-24 h-24 mb-10 flex items-center justify-center">
              <div className="absolute inset-0 border-t-4 border-[#4A2E1B]/80 rounded-full animate-[spin_3s_linear_infinite]"></div>
              <div className="absolute inset-3 border-b-4 border-amber-700/80 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
              <Sparkles className="text-amber-700 animate-pulse" size={28} />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={triviaIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                className="text-[#4A2E1B] font-serif italic text-xl leading-relaxed"
              >
                "{wastraTrivia[triviaIndex]}"
              </motion.p>
            </AnimatePresence>
            
            <p className="font-mono tracking-[0.3em] uppercase text-[10px] text-[#4A2E1B]/40 mt-12 animate-pulse font-bold">
              Menelusuri Pustaka KriyaChain...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-md border border-[#4A2E1B]/10 rounded-3xl">
            <Sparkles className="mx-auto text-[#4A2E1B]/20 mb-4" size={48} />
            <p className="text-[#4A2E1B]/60 font-medium">
              {viewMode === "collection" ? "Belum ada mahakarya di lemari koleksimu." : "Belum ada mahakarya yang ditemukan."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="h-full"
              >
                <Tilt 
                  tiltMaxAngleX={8} 
                  tiltMaxAngleY={8} 
                  perspective={1000} 
                  scale={1.02} 
                  transitionSpeed={2000} 
                  glareEnable={true} 
                  glareMaxOpacity={0.15} 
                  glareColor="#ffffff" 
                  glarePosition="all" 
                  className="h-full rounded-3xl"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-[#4A2E1B]/10 shadow-sm hover:shadow-2xl hover:shadow-[#4A2E1B]/20 transition-all duration-300 flex flex-col h-full overflow-hidden group">
                    
                    <div 
                      className="relative w-full h-56 bg-[#4A2E1B]/5 flex items-center justify-center overflow-hidden border-b border-[#4A2E1B]/5 cursor-pointer group/image"
                      onClick={() => product.image_url && setSelectedImage(product.image_url)}
                    >
                      {product.image_url ? (
                        <>
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                          <div className="absolute inset-0 bg-[#4A2E1B]/0 group-hover/image:bg-[#4A2E1B]/20 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px] opacity-0 group-hover/image:opacity-100">
                            <Maximize2 className="text-white drop-shadow-lg scale-50 group-hover/image:scale-100 transition-transform duration-300" size={32} />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-[#4A2E1B]/20">
                          <ImageIcon size={48} strokeWidth={1} />
                          <span className="text-[10px] font-bold tracking-widest uppercase mt-2">Tanpa Visual</span>
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4 z-10 shadow-lg">
                        {product.is_claimed ? (
                          <span className="px-3 py-1 bg-green-50/90 backdrop-blur-md text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-200">
                            Dimiliki
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50/90 backdrop-blur-md text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-200">
                            Tersedia
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1 relative z-20">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-[#4A2E1B]/5 rounded-xl text-[#4A2E1B]">
                          <ShieldCheck size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-serif font-bold text-[#4A2E1B] mb-2">{product.name}</h3>
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-[#4A2E1B]/70 flex items-center gap-2">
                          <User size={14} className="opacity-50" /> {product.artisan}
                        </p>
                        {product.origin && (
                          <p className="text-xs text-[#4A2E1B]/70 flex items-center gap-2">
                            <MapPin size={14} className="opacity-50" /> {product.origin}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-[#4A2E1B]/10">
                        <p className="text-[10px] text-[#4A2E1B]/40 font-mono break-all line-clamp-1">
                          UUID: {product.qr_code}
                        </p>
                        {product.is_claimed && (
                          <p className="text-[10px] font-bold text-[#4A2E1B]/60 mt-2 uppercase tracking-wide">
                            Kolektor: <span className="text-[#4A2E1B]">{product.owner_name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedImage(null)} 
              className="absolute inset-0 bg-[#4A2E1B]/80 backdrop-blur-md cursor-pointer" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="relative z-10 max-w-4xl w-full flex flex-col items-center justify-center pointer-events-none"
            >
              <img 
                src={selectedImage} 
                alt="Full Wastra" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl pointer-events-auto" 
              />
              <button 
                onClick={() => setSelectedImage(null)} 
                className="absolute -top-4 -right-4 md:top-4 md:right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md pointer-events-auto shadow-lg"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%234A2E1B' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundPosition: 'center',
        }}
      ></div>
    </div>
  );
}