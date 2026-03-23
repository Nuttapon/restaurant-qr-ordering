'use client'
import { useState, useEffect, useRef } from 'react'

// --- Intersection Observer Hook ---
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// --- SVG Icons ---
const IconQR = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
    <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h1v3h-1zM17 18h1v1h-1zM19 18h2v3h-2z"/>
  </svg>
)
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
  </svg>
)
const IconChef = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0A4 4 0 0118 13.87V21H6z"/><line x1="6" y1="17" x2="18" y2="17"/>
  </svg>
)
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
)
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

// --- Global SVG background patterns ---
const DotGrid = () => (
  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots)" />
  </svg>
)

// --- Floating food particles (pure CSS animated) ---
const FOOD_ITEMS = [
  { e: '🍜', x: '8%',  y: '15%', d: '0s',   s: '6s',  size: '2.2rem', opacity: 0.18 },
  { e: '🌶️', x: '88%', y: '22%', d: '1.5s', s: '8s',  size: '1.8rem', opacity: 0.15 },
  { e: '🍳', x: '15%', y: '65%', d: '0.8s', s: '7s',  size: '2rem',   opacity: 0.15 },
  { e: '🌿', x: '78%', y: '55%', d: '2.2s', s: '9s',  size: '1.6rem', opacity: 0.12 },
  { e: '🍚', x: '50%', y: '8%',  d: '3s',   s: '10s', size: '1.5rem', opacity: 0.12 },
  { e: '🥢', x: '92%', y: '75%', d: '0.3s', s: '7s',  size: '1.8rem', opacity: 0.13 },
  { e: '🧅', x: '3%',  y: '80%', d: '1.9s', s: '8.5s',size: '1.6rem', opacity: 0.11 },
  { e: '🍋', x: '62%', y: '90%', d: '1s',   s: '6.5s',size: '1.7rem', opacity: 0.13 },
]

function FloatingFoods() {
  return (
    <>
      {FOOD_ITEMS.map((f, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            left: f.x, top: f.y,
            fontSize: f.size,
            opacity: f.opacity,
            animation: `foodFloat ${f.s} ease-in-out ${f.d} infinite alternate`,
            filter: 'blur(0.5px)',
          }}
        >
          {f.e}
        </div>
      ))}
    </>
  )
}

// --- Feature Card ---
type FeatureCardProps = { icon: React.ReactNode; title: string; desc: string; color: string; delay?: string }
function FeatureCard({ icon, title, desc, color, delay = '0s' }: FeatureCardProps) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)' }}
      className="transition-all duration-700 ease-out group p-7 rounded-3xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl hover:border-white/20 relative overflow-hidden cursor-default"
    >
      {/* Corner grain texture */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(circle at top right, ${color}20 0%, transparent 70%)` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 20% 80%, ${color}12 0%, transparent 60%)` }} />
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg border border-white/10" style={{ background: `linear-gradient(135deg, ${color}30, ${color}18)`, color }}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 leading-snug">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// --- Step Card ---
type StepProps = { num: string; title: string; desc: string; accent: string }
function Step({ num, title, desc, accent }: StepProps) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateX(-24px)' }} className="transition-all duration-700 ease-out flex gap-6 items-start group">
      <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border border-white/10 group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}15)`, color: accent }}>{num}</div>
      <div className="pt-1">
        <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// --- Use Case Card ---
type UseCaseCardProps = { emoji: string; title: string; desc: string }
function UseCaseCard({ emoji, title, desc }: UseCaseCardProps) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateX(24px)' }} className="transition-all duration-500 ease-out flex items-start gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all group cursor-default">
      <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform duration-200">{emoji}</span>
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

// --- Stat Badge ---
function StatBadge({ value, label }: { value: string; label: string }) {
  const { ref, inView } = useInView(0.3)
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'scale(1)' : 'scale(0.8)' }} className="transition-all duration-700 ease-out text-center group">
      <div className="text-4xl md:text-5xl font-black text-white tracking-tight group-hover:scale-105 transition-transform duration-200">{value}</div>
      <div className="text-slate-500 text-sm mt-2 font-medium">{label}</div>
    </div>
  )
}

// --- Mock Phone UI ---
function MockPhone() {
  const [qty, setQty] = useState(1)
  return (
    <div className="w-[260px] rounded-[36px] overflow-hidden select-none mx-auto shadow-2xl shadow-black/50 border border-white/10" style={{ background: 'linear-gradient(160deg, #1e1916 0%, #110f0d 100%)' }}>
      <div style={{ background: 'linear-gradient(90deg, #D4622B, #C4511F)' }} className="px-5 py-3.5 flex justify-between items-center">
        <span className="text-white font-black text-base tracking-tight">เมนูอาหาร</span>
        <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">โต๊ะ 4</span>
      </div>
      <div className="px-4 pt-3 pb-2">
        <div className="bg-white/8 rounded-xl px-3 py-2 text-slate-400 text-xs flex items-center gap-2 border border-white/8">
          <span>🔍</span><span>ค้นหาเมนู...</span>
        </div>
        <div className="flex gap-2 mt-2 overflow-hidden">
          {['ทั้งหมด', 'ก๋วยเตี๋ยว', 'ข้าว', 'เครื่องดื่ม'].map((c, i) => (
            <span key={c} className={`text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 ${i === 0 ? 'text-white' : 'bg-white/8 text-slate-400'}`} style={i === 0 ? { background: 'linear-gradient(90deg, #D4622B, #C4511F)' } : {}}>{c}</span>
          ))}
        </div>
      </div>
      <div className="px-4 py-2 space-y-3">
        {[
          { name: 'ข้าวผัด ไก่กรอบ', en: 'Crispy Chicken Rice', price: '65', emoji: '🍳' },
          { name: 'ต้มยำกุ้ง', en: 'Tom Yum Goong', price: '120', emoji: '🍜' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/8">
            <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(212,98,43,0.15)' }}>{item.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-xs leading-snug">{item.name}</p>
              <p className="text-slate-500 text-[10px]">{item.en}</p>
              <p className="font-black text-sm mt-1" style={{ color: '#D4622B' }}>฿{item.price}</p>
            </div>
            <button className="text-white text-xs font-bold px-2 py-1.5 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #D4622B, #C4511F)' }}>+ เพิ่ม</button>
          </div>
        ))}
      </div>
      <div className="px-4 pb-5 pt-2">
        <div className="text-white rounded-full px-5 py-3 flex items-center justify-between shadow-lg" style={{ background: 'linear-gradient(90deg, #D4622B, #E07B3A)' }}>
          <div className="flex items-center gap-2">
            <span className="bg-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ color: '#D4622B' }}>{qty}</span>
            <span className="text-sm font-bold">ดูตะกร้า</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">฿{65 * qty}</span>
            <div className="flex gap-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="bg-white/20 w-5 h-5 rounded-full text-[10px] flex items-center justify-center active:scale-90 transition-transform">−</button>
              <button onClick={() => setQty(q => q + 1)} className="bg-white/20 w-5 h-5 rounded-full text-[10px] flex items-center justify-center active:scale-90 transition-transform">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================
// MAIN PAGE
// ========================
export default function LandingPageClient() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#0A0806', fontFamily: "'Sarabun', system-ui, sans-serif" }}>
      {/* ====== Fonts + Animations ====== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');

        @keyframes foodFloat {
          0%   { transform: translateY(0px) rotate(-4deg); }
          50%  { transform: translateY(-18px) rotate(2deg); }
          100% { transform: translateY(-8px) rotate(-2deg); }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.5;  transform: scale(1.08); }
        }

        .text-shimmer {
          background: linear-gradient(90deg, #D4622B 0%, #F5A623 40%, #D4622B 60%, #E5A840 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .glow-orange {
          box-shadow: 0 0 40px rgba(212, 98, 43, 0.35), 0 0 80px rgba(212, 98, 43, 0.15);
        }

        .noise-overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.035;
          pointer-events: none;
          mix-blend-mode: overlay;
        }

        .ring-spin {
          animation: slowSpin 20s linear infinite;
        }

        .orb-breathe {
          animation: breathe 6s ease-in-out infinite;
        }
      `}</style>

      {/* ====== NAVBAR ====== */}
      <nav
        style={{
          backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
          background: scrolled ? 'rgba(10,8,6,0.88)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-400 px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl glow-orange" style={{ background: 'linear-gradient(135deg, #D4622B, #C4511F)' }}>Q</div>
          <span className="text-white font-bold text-lg tracking-tight">QR ออร์เดอร์</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors duration-200">ฟีเจอร์</a>
          <a href="#howto" className="hover:text-white transition-colors duration-200">วิธีใช้</a>
          <a href="#demo" className="hover:text-white transition-colors duration-200">ทดลองใช้</a>
        </div>
        <a
          href="/menu?token=tok_dev_table_01_xxxxxxxxxx"
          className="text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 glow-orange"
          style={{ background: 'linear-gradient(135deg, #D4622B, #C4511F)' }}
        >
          ทดลองเลย →
        </a>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 overflow-hidden noise-overlay">
        {/* Deep layered background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient mesh */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 10%, rgba(212,98,43,0.22) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(180,60,20,0.12) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 90% 70%, rgba(229,168,64,0.08) 0%, transparent 50%)' }} />
          {/* Spinning decorative ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ring-spin">
            <div className="w-[700px] h-[700px] rounded-full border border-white/[0.025]" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'slowSpin 30s linear infinite reverse' }}>
            <div className="w-[500px] h-[500px] rounded-full border border-white/[0.03]" style={{ borderStyle: 'dashed' }} />
          </div>
          {/* Central glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full orb-breathe" style={{ background: 'radial-gradient(ellipse, rgba(212,98,43,0.28) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          {/* Dot grid */}
          <DotGrid />
        </div>

        {/* Floating food */}
        <FloatingFoods />

        {/* Hero content */}
        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2.5 border border-white/15 rounded-full px-4 py-2 text-sm text-slate-300 font-medium mb-8 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            ระบบพร้อมใช้งาน — ไม่ต้องติดตั้งแอป
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            สั่งอาหาร<br/>
            <span className="text-shimmer">ง่ายแค่สแกน</span><br/>
            QR Code
          </h1>

          <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed mb-12">
            ลูกค้าสแกน QR ที่โต๊ะ → เลือกเมนู → สั่งอาหาร<br/>
            <span className="text-slate-500">ไม่ต้องรอพนักงาน ไม่ต้องโหลดแอป</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/menu?token=tok_dev_table_01_xxxxxxxxxx"
              className="group w-full sm:w-auto text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 glow-orange"
              style={{ background: 'linear-gradient(135deg, #D4622B 0%, #E07B3A 50%, #C4511F 100%)', boxShadow: '0 8px 32px rgba(212,98,43,0.4), 0 2px 8px rgba(212,98,43,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}
            >
              <span className="text-xl">📱</span>
              ทดลองใช้งาน Demo
              <span className="opacity-60 group-hover:translate-x-1 transition-transform duration-200">→</span>
            </a>
            <a
              href="#features"
              className="w-full sm:w-auto font-bold px-8 py-4 rounded-2xl text-lg transition-all duration-200 flex items-center justify-center gap-2 text-white hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}
            >
              ดูฟีเจอร์ทั้งหมด ↓
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-sm text-slate-500">
            {['✓ ไม่ต้องติดตั้งแอป', '✓ รองรับทุก Smartphone', '✓ Real-time อัปเดตทันที', '✓ ปลอดภัย 100%'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div className="relative mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Phone glow */}
          <div className="absolute -inset-8 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(212,98,43,0.25) 0%, transparent 65%)', filter: 'blur(24px)', transform: 'scaleY(0.4) translateY(60%)' }} />
          <MockPhone />
        </div>
      </section>

      {/* ====== STATS ====== */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Divider line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        {/* Background accent */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(212,98,43,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-white/8 p-10 md:p-14" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/8">
              <StatBadge value="3 วิ" label="เวลาเปิดหน้าเมนู" />
              <StatBadge value="฿0" label="ค่าแอปสำหรับลูกค้า" />
              <StatBadge value="∞" label="สั่งอาหารได้หลายรอบ" />
              <StatBadge value="Live" label="ครัวเห็นทันที" />
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-28 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,98,43,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(229,168,64,0.06) 0%, transparent 70%)', filter: 'blur(30px)' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#D4622B' }}>ฟีเจอร์</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">ทุกอย่างที่ร้านต้องการ</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">ออกแบบมาเพื่อธุรกิจร้านอาหารโดยเฉพาะ ครบ จบ ใน 1 ระบบ</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={<div className="w-6 h-6"><IconQR /></div>} title="QR Code ประจำโต๊ะ" desc="แต่ละโต๊ะมี QR ที่ไม่เหมือนกัน สแกนแล้วเข้าสู่เมนูทันที ไม่ต้องล็อกอิน ไม่ต้องสมัคร" color="#D4622B" delay="0s" />
            <FeatureCard icon={<div className="w-6 h-6"><IconPhone /></div>} title="เมนูดิจิทัลสวยงาม" desc="แสดงรูปภาพ คำอธิบาย ราคา พร้อมระบบค้นหาเมนูแบบ Real-time กรองตามหมวดหมู่ได้ทันที" color="#E5A840" delay="0.1s" />
            <FeatureCard icon={<div className="w-6 h-6"><IconChef /></div>} title="จอครัว (KDS)" desc="ครัวเห็นออเดอร์ทันทีที่ลูกค้าสั่ง พร้อมตัวจับเวลาและสีแจ้งเตือนความเร่งด่วน" color="#4CAF7D" delay="0.2s" />
            <FeatureCard icon={<div className="w-6 h-6"><IconBell /></div>} title="แจ้งเตือน Real-time" desc="เรียกพนักงาน ขอเช็คบิล หรือมีออเดอร์ใหม่ — แจ้งเตือนทุกอย่างทันทีโดยไม่ต้องรีเฟรช" color="#D4627B" delay="0.3s" />
            <FeatureCard icon={<div className="w-6 h-6"><IconChart /></div>} title="แดชบอร์ดผู้จัดการ" desc="ดูสถานะโต๊ะทั้งหมด จัดการเมนู แก้ไขราคา Upload รูปภาพอาหาร และออก QR Code ได้เอง" color="#6C8EEF" delay="0.4s" />
            <FeatureCard icon={<div className="w-6 h-6"><IconShield /></div>} title="ปลอดภัย & เสถียร" desc="สร้างบน Supabase ระบบคลาวด์ระดับ Enterprise ข้อมูลลูกค้าถูกปกป้องด้วย Row-Level Security" color="#8B5CF6" delay="0.5s" />
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="howto" className="py-28 px-6 relative overflow-hidden">
        {/* Warm right-side glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 80% at 90% 40%, rgba(212,98,43,0.1) 0%, transparent 60%)' }} />
        {/* Horizontal rule */}
        <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(212,98,43,0.2) 50%, rgba(255,255,255,0.08) 70%, transparent)' }} />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: '#D4622B' }}>วิธีใช้งาน</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">ง่ายมาก ใน 3 ขั้นตอน</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="space-y-10">
              <Step num="1" title="ลูกค้าสแกน QR บนโต๊ะ" desc="ใช้กล้องมือถือสแกน QR Code ที่ติดไว้บนโต๊ะ เข้าสู่หน้าเมนูทันที ไม่ต้องติดตั้งแอป" accent="#D4622B" />
              <Step num="2" title="เลือกเมนูและสั่งอาหาร" desc="เลือกดูเมนู ใส่ตะกร้า กด 'สั่งอาหาร' ออเดอร์ไปยังครัวทันที สั่งซ้ำได้หลายรอบตลอดมื้อ" accent="#E5A840" />
              <Step num="3" title="ครัวทำอาหาร จ่ายเงิน" desc="ครัวรับออเดอร์ผ่านจอ KDS ทำอาหาร เสร็จแล้วลูกค้ากดขอเช็คบิลได้จากมือถือ" accent="#4CAF7D" />
            </div>

            <div className="space-y-4">
              <UseCaseCard emoji="🍜" title="ร้านอาหารทั่วไป" desc="ลดภาระพนักงานจด order — ไม่ต้องเดินถามซ้ำแล้วซ้ำเล่า" />
              <UseCaseCard emoji="🍣" title="ร้านบุฟเฟ่ต์" desc="ลูกค้าสั่งได้เองไม่จำกัดรอบ ไม่ต้องรอเรียกพนักงาน" />
              <UseCaseCard emoji="☕" title="คาเฟ่" desc="เมนูสวยงามพร้อมรูปภาพ ช่วยตัดสินใจและเพิ่มยอดขาย" />
              <UseCaseCard emoji="🏪" title="ฟู้ดคอร์ท" desc="จัดการหลายโต๊ะพร้อมกัน ลดข้อผิดพลาดจากการสั่งด้วยวาจา" />
            </div>
          </div>
        </div>
      </section>

      {/* ====== DEMO CTA ====== */}
      <section id="demo" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,98,43,0.12) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto relative">
          <div
            className="relative rounded-[40px] p-12 text-center overflow-hidden noise-overlay"
            style={{
              background: 'linear-gradient(135deg, rgba(212,98,43,0.15) 0%, rgba(180,60,20,0.08) 50%, rgba(10,8,6,0.6) 100%)',
              border: '1px solid rgba(212,98,43,0.25)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,98,43,0.2) 0%, transparent 60%)' }} />
            {/* Top accent line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,98,43,0.6), transparent)' }} />

            <div className="relative">
              <div className="text-6xl mb-6 animate-bounce" style={{ animationDuration: '2s' }}>📱</div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                ลองสัมผัสด้วย<br/>ตัวเองเลย
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                เราเตรียม Demo สำหรับทดลองใช้งานพร้อมแล้ว<br/>
                ลองสั่งอาหาร ดูหน้าครัว และแดชบอร์ดผู้จัดการ
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/menu?token=tok_dev_table_01_xxxxxxxxxx" style={{ background: 'linear-gradient(135deg, #D4622B, #E07B3A)', boxShadow: '0 8px 24px rgba(212,98,43,0.4)' }} className="text-white font-bold px-6 py-4 rounded-2xl text-base hover:scale-105 active:scale-95 transition-all duration-200">
                  🛒 หน้าเมนูลูกค้า
                </a>
                <a href="/kitchen" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} className="text-white font-bold px-6 py-4 rounded-2xl text-base hover:bg-white/10 transition-all backdrop-blur-md">
                  👨‍🍳 จอครัว KDS
                </a>
                <a href="/admin" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }} className="text-white font-bold px-6 py-4 rounded-2xl text-base hover:bg-white/10 transition-all backdrop-blur-md">
                  ⚙️ แดชบอร์ด Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="py-12 px-6 text-center relative">
        <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 50%, transparent)' }} />
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ background: 'linear-gradient(135deg, #D4622B, #C4511F)' }}>Q</div>
          <span className="text-white font-bold">QR ออร์เดอร์</span>
        </div>
        <p className="text-slate-600 text-sm">ระบบสั่งอาหารดิจิทัล สำหรับร้านอาหารยุคใหม่</p>
      </footer>
    </div>
  )
}
