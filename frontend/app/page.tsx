"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { QrCode, ScrollText, ScanSearch, Lock, X, ArrowRight, Quote, Compass, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import QrScannerModal from "./components/QrScannerModal";
import Tilt from "react-parallax-tilt";

export default function Home() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);

  
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"]
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#4A2E1B] font-sans selection:bg-[#4A2E1B] selection:text-white overflow-x-hidden relative">
      
      
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl font-serif font-semibold tracking-tight"
        >
          KriyaChain
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-6 items-center"
        >
          <Link href="/explorer" className="hidden sm:block text-sm font-bold uppercase tracking-widest text-[#4A2E1B]/70 hover:text-[#4A2E1B] transition-colors">
            Galeri Publik
          </Link>
          <Link href="/admin" className="text-sm font-bold uppercase tracking-widest text-[#4A2E1B]/70 hover:text-[#4A2E1B] transition-colors bg-[#4A2E1B]/5 px-4 py-2 rounded-full hover:bg-[#4A2E1B]/10">
            Portal Pengrajin
          </Link>
        </motion.div>
      </nav>

      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.03 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="w-[800px] h-[800px] rounded-full bg-[#4A2E1B] blur-[120px]"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 px-5 py-2 rounded-full border border-[#4A2E1B]/20 bg-[#4A2E1B]/5 backdrop-blur-md relative z-10"
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#4A2E1B]/80 flex items-center gap-2">
            <SparklesIcon /> Sistem Verifikasi Wastra Nusantara
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.1] tracking-tight max-w-5xl relative z-10"
        >
          Sertifikasi Mahakarya <br /> 
          <span className="italic text-[#4A2E1B]/80 drop-shadow-sm">Dalam Setiap Helai.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="mt-8 text-lg md:text-xl text-[#4A2E1B]/60 max-w-2xl font-light relative z-10"
        >
          Setiap kain memiliki jiwa dan cerita. Pindai, pelajari sejarahnya, dan klaim kepemilikan wastra asli Anda melalui teknologi digital yang transparan
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 sm:px-0 relative z-10"
        >
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center justify-center gap-3 bg-[#4A2E1B] text-white px-8 py-4 rounded-2xl shadow-2xl shadow-[#4A2E1B]/20 hover:bg-[#3A2214] transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
          >
            <QrCode size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Scan Wastra Sekarang</span>
          </button>
          
          <Link 
            href="/explorer"
            className="flex items-center justify-center gap-3 bg-white/50 backdrop-blur-md text-[#4A2E1B] border border-[#4A2E1B]/20 px-8 py-4 rounded-2xl shadow-xl shadow-[#4A2E1B]/5 hover:bg-white transition-all duration-300 hover:scale-[1.02] active:scale-95 group"
          >
            <Compass size={20} className="group-hover:-rotate-12 transition-transform" />
            <span className="font-medium">Eksplorasi Galeri</span>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#4A2E1B]/40"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
          <ChevronDown className="animate-bounce" size={20} />
        </motion.div>
      </main>

      
      <section className="relative z-10 w-full max-w-6xl mx-auto mt-20 mb-32 px-6 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-serif text-[#4A2E1B] tracking-tight mb-6">
            Lebih Dari Sekadar Kain.
          </h2>
          <p className="text-lg text-[#4A2E1B]/70 max-w-2xl mx-auto font-light leading-relaxed">
            Di KriyaChain, kami memadukan warisan leluhur dengan verifikasi digital modern. Memastikan keringat pengrajin dihargai, sekaligus memberikan kepastian keaslian bagi Anda.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16 perspective-1000">
          
          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="h-full">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="p-10 h-full rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-[#4A2E1B]/5 hover:shadow-2xl transition-all"
            >
              <div className="mb-8 inline-flex p-5 rounded-2xl bg-[#4A2E1B]/5 text-[#4A2E1B]">
                <ScrollText size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#4A2E1B] mb-4">1. Registrasi Karya</h3>
              <p className="text-sm text-[#4A2E1B]/70 leading-relaxed font-light">
                Pengrajin mencatatkan karya wastra mereka ke dalam sistem. Sebuah identitas digital (UUID) unik dilahirkan untuk setiap helai kain
              </p>
            </motion.div>
          </Tilt>

          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="h-full">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="p-10 h-full rounded-[2.5rem] bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-[#4A2E1B]/5 hover:shadow-2xl transition-all"
            >
              <div className="mb-8 inline-flex p-5 rounded-2xl bg-[#4A2E1B]/5 text-[#4A2E1B]">
                <ScanSearch size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#4A2E1B] mb-4">2. Pindai & Pelajari</h3>
              <p className="text-sm text-[#4A2E1B]/70 leading-relaxed font-light">
                Pembeli memindai QR Code rahasia pada label Wastra untuk melihat siapa pengrajinnya, asal-usulnya, dan sejarah motif tersebut.
              </p>
            </motion.div>
          </Tilt>

          <Tilt tiltMaxAngleX={5} tiltMaxAngleY={5} scale={1.02} transitionSpeed={2000} className="h-full">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="p-10 h-full rounded-[2.5rem] bg-[#4A2E1B] text-white shadow-2xl shadow-[#4A2E1B]/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
              <div className="mb-8 inline-flex p-5 rounded-2xl bg-white/10 text-white relative z-10 backdrop-blur-md">
                <Lock size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-serif font-bold mb-4 relative z-10">3. Klaim Kepemilikan</h3>
              <p className="text-sm text-white/80 leading-relaxed font-light relative z-10">
                Setelah dibeli, Anda dapat mengklaim kepemilikannya. Sistem akan mengunci Wastra tersebut atas nama Anda, mencegah pemalsuan di masa depan.
              </p>
            </motion.div>
          </Tilt>

        </div>
      </section>

      
      <section ref={timelineRef} className="relative z-10 w-full max-w-5xl mx-auto mb-40 px-6 pt-20">
        <div className="text-center mb-24">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#4A2E1B]/40 mb-3 block">Jejak Waktu</span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#4A2E1B] tracking-tight">
            Evolusi Wastra Nusantara.
          </h2>
        </div>

        <div className="relative ml-4 md:ml-1/2 md:left-1/2 md:-translate-x-1/2 space-y-24 py-8">
          
          
          <div className="absolute top-0 bottom-0 left-0 md:left-1/2 md:-translate-x-1/2 w-[2px] bg-[#4A2E1B]/10 rounded-full"></div>
          
          
          <motion.div 
            style={{ height: lineHeight }} 
            className="absolute top-0 left-0 md:left-1/2 md:-translate-x-1/2 w-[2px] bg-amber-700 rounded-full shadow-[0_0_10px_rgba(180,83,9,0.5)] origin-top"
          ></motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative pl-12 md:pl-0 md:w-1/2 md:pr-16 text-left md:text-right group"
          >
            <div className="absolute top-0 left-[-7px] md:right-[-7px] md:left-auto w-4 h-4 bg-[#F8F7F4] border-[3px] border-[#4A2E1B]/30 group-hover:border-amber-700 rounded-full transition-colors z-10"></div>
            <p className="text-xs font-bold text-[#4A2E1B]/40 mb-2 font-mono tracking-[0.2em]">ABAD 17</p>
            <h4 className="text-3xl font-serif font-bold text-[#4A2E1B] mb-4">Eksklusivitas Keraton</h4>
            <p className="text-[#4A2E1B]/70 font-light text-sm md:text-base leading-relaxed">
              Motif awal diciptakan sebagai bahasa simbolik yang hanya boleh dikenakan oleh keluarga kerajaan. Setiap goresan canting adalah doa dan batasan kasta sosial.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative pl-12 md:pl-16 md:w-1/2 md:ml-auto text-left group"
          >
            <div className="absolute top-0 left-[-7px] w-4 h-4 bg-[#F8F7F4] border-[3px] border-[#4A2E1B]/30 group-hover:border-amber-700 rounded-full transition-colors z-10"></div>
            <p className="text-xs font-bold text-[#4A2E1B]/40 mb-2 font-mono tracking-[0.2em]">ABAD 19</p>
            <h4 className="text-3xl font-serif font-bold text-[#4A2E1B] mb-4">Akulturasi Pesisir</h4>
            <p className="text-[#4A2E1B]/70 font-light text-sm md:text-base leading-relaxed">
              Pedagang asing membawa warna baru. Wastra keluar dari keraton, menyerap pigmen alam yang cerah dan melahirkan motif flora-fauna lintas benua yang ekspresif.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative pl-12 md:pl-0 md:w-1/2 md:pr-16 text-left md:text-right group"
          >
            <div className="absolute top-0 left-[-7px] md:right-[-7px] md:left-auto w-4 h-4 bg-amber-700 rounded-full shadow-[0_0_15px_rgba(180,83,9,0.6)] z-10 animate-pulse"></div>
            <p className="text-xs font-bold text-amber-700/80 mb-2 font-mono tracking-[0.2em]">ERA DIGITAL</p>
            <h4 className="text-3xl font-serif font-bold text-[#4A2E1B] mb-4">Sertifikasi KriyaChain</h4>
            <p className="text-[#4A2E1B]/70 font-light text-sm md:text-base leading-relaxed">
              Kini, nilai sejarah dilindungi oleh teknologi. KriyaChain memastikan setiap helai Wastra otentik tercatat secara abadi, melindungi hak cipta pengrajin lokal dari pemalsuan industri
            </p>
          </motion.div>

        </div>
      </section>

      
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative w-full bg-[#4A2E1B] text-[#F8F7F4] py-24 px-6 md:px-16 lg:px-24 my-20 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl mx-auto max-w-[95%] lg:max-w-[90%] mb-32"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F8F7F4] opacity-5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-600 opacity-10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-16">
          
          <div className="md:w-5/12">
            <ScrollText className="text-amber-200/50 mb-8" size={48} strokeWidth={1} />
            <h3 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-[1.1]">
              Setiap Wastra<br/>Adalah <span className="text-amber-200/90 italic font-light">Cerita.</span>
            </h3>
          </div>

          <div className="md:w-7/12 md:pl-12 border-t md:border-t-0 md:border-l border-[#F8F7F4]/10 pt-8 md:pt-0">
            <div className="space-y-6 text-[#F8F7F4]/80 font-light text-lg leading-relaxed">
              <p>
                Batik dan tenun bukan sekadar kain bermotif. Mereka adalah manuskrip peradaban. Di setiap titik malam dan silangan benang, tertanam doa, filosofi, dan keringat pengrajin yang mengerjakannya selama berbulan-bulan.
              </p>
              <p>
                Melalui <strong className="font-semibold text-amber-200 tracking-wide">KriyaChain</strong>, kami tidak hanya mencatat kepemilikan. Kami mengabadikan narasi tersebut ke dalam blockchain agar tak pernah lapuk dimakan zaman.
              </p>
              
              <button 
                onClick={() => setIsManifestoOpen(true)}
                className="mt-8 inline-flex items-center gap-3 text-amber-200 hover:text-white font-medium group transition-colors pb-2 border-b border-amber-200/30 hover:border-white uppercase tracking-widest text-xs"
              >
                Baca Manifesto Kami <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </motion.section>

      
      <AnimatePresence>
        {isManifestoOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsManifestoOpen(false)} 
              className="absolute inset-0 bg-[#4A2E1B]/60 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-[#F8F7F4] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#4A2E1B] p-10 md:p-16 relative shrink-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <button 
                  onClick={() => setIsManifestoOpen(false)} 
                  className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white backdrop-blur-md z-10"
                >
                  <X size={20} />
                </button>
                <div className="w-14 h-14 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md text-amber-200 relative z-10">
                  <Quote size={24} />
                </div>
                <h3 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3 relative z-10">Manifesto KriyaChain</h3>
                <p className="text-amber-100/70 text-xs font-bold tracking-[0.2em] uppercase relative z-10">Melindungi Warisan, Menjaga Keaslian</p>
              </div>

              <div className="p-10 md:p-16 overflow-y-auto custom-scrollbar text-[#4A2E1B]/80 font-light text-lg leading-relaxed space-y-6">
                <p className="first-letter:text-6xl first-letter:font-serif first-letter:text-[#4A2E1B] first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">
                  Tujuan kami sederhana: Kami menolak membiarkan karya tangan leluhur kita luntur nilainya menjadi sekadar komoditas pabrik masal. Setiap silangan benang dan titik malam pada wastra Nusantara bukan sekadar pola, melainkan doa, identitas, dan sejarah yang ditulis oleh tangan para seniman lokal.
                </p>
                <p>
                  KriyaChain lahir dari kegelisahan melihat nilai historis ini memudar oleh komersialisasi dan pemalsuan. Kami menggunakan teknologi blockchain bukan sekadar untuk mengikuti tren, melainkan karena sifatnya sebagai buku besar abadi yang tidak bisa dimanipulasi oleh siapa pun.
                </p>
                <p>
                  Dengan sistem ini, setiap wastra mendapatkan identitas digitalnya sendiri. Siapa pembuatnya, dari mana asalnya, dan ke mana perjalanannya—semuanya terkunci secara transparan. Kami tidak hanya melacak sehelai kain, kami mengamankan identitas budaya agar tetap abadi melintasi generasi.
                </p>
              </div>
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

      <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-700">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}