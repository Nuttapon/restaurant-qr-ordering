'use client'
import { useState, useEffect, useRef } from 'react'

// --- Helper: Intersection Observer Hook for scroll animations ---
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

// --- Inline SVG Icons ---
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

// --- Feature Card ---
type FeatureCardProps = { icon: React.ReactNode; title: string; desc: string; color: string; delay?: string }
function FeatureCard({ icon, title, desc, color, delay = '0s' }: FeatureCardProps) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay, opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)' }}
      className="transition-all duration-700 ease-out group p-7 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md hover:border-white/20 relative overflow-hidden cursor-default"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 30% 30%, ${color}18 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background: `${color}22`, color }}>
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
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateX(-24px)' }} className="transition-all duration-700 ease-out flex gap-6 items-start">
      <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl border border-white/10" style={{ background: `${accent}22`, color: accent }}>{num}</div>
      <div>
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
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'none' : 'translateX(24px)' }} className="transition-all duration-500 ease-out flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <span className="text-3xl shrink-0">{emoji}</span>
      <div>
        <p className="font-bold text-white">{title}</p>
        <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

// --- Mock Phone UI ---
function MockPhone() {
  const [qty, setQty] = useState(1)
  return (
    <div className="w-[260px] bg-[#1a1614] rounded-[36px] shadow-2xl border border-white/10 overflow-hidden select-none mx-auto">
      {/* Status bar */}
      <div className="bg-[#D4622B] px-5 py-3 flex justify-between items-center">
        <span className="text-white font-black text-base">เมนูอาหาร</span>
        <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">โต๊ะ 4</span>
      </div>
      {/* Search */}
      <div className="px-4 pt-3 pb-2 bg-[#1a1614]/90">
        <div className="bg-white/10 rounded-xl px-3 py-2 text-slate-400 text-xs flex items-center gap-2">
          <span>🔍</span><span>ค้นหาเมนู...</span>
        </div>
        <div className="flex gap-2 mt-2 overflow-hidden">
          {['ทั้งหมด', 'ก๋วยเตี๋ยว', 'ข้าว', 'เครื่องดื่ม'].map((c, i) => (
            <span key={c} className={`text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 ${i === 0 ? 'bg-[#D4622B] text-white' : 'bg-white/10 text-slate-400'}`}>{c}</span>
          ))}
        </div>
      </div>
      {/* Menu items */}
      <div className="px-4 py-2 space-y-3">
        {[
          { name: 'ข้าวผัด ไก่กรอบ', en: 'Crispy Chicken Rice', price: '65' },
          { name: 'ต้มยำกุ้ง', en: 'Tom Yum Goong', price: '120' },
        ].map((item) => (
          <div key={item.name} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-orange-500/30 to-orange-700/20 flex items-center justify-center text-2xl">🍳</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-xs leading-snug">{item.name}</p>
              <p className="text-slate-500 text-[10px]">{item.en}</p>
              <p className="text-[#D4622B] font-black text-sm mt-1">฿{item.price}</p>
            </div>
            <button className="bg-[#D4622B] text-white text-xs font-bold px-2 py-1.5 rounded-lg shrink-0">+ เพิ่ม</button>
          </div>
        ))}
      </div>
      {/* Cart button */}
      <div className="px-4 pb-5 pt-2">
        <div className="bg-[#D4622B] text-white rounded-full px-5 py-3 flex items-center justify-between shadow-lg shadow-orange-900/40">
          <div className="flex items-center gap-2">
            <span className="bg-white text-[#D4622B] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">{qty}</span>
            <span className="text-sm font-bold">ดูตะกร้า</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">฿65</span>
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

// --- Stat Counter ---
function StatBadge({ value, label }: { value: string; label: string }) {
  const { ref, inView } = useInView(0.3)
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? 'scale(1)' : 'scale(0.8)' }} className="transition-all duration-700 ease-out text-center">
      <div className="text-5xl font-black text-white tracking-tight">{value}</div>
      <div className="text-slate-400 text-sm mt-2 font-medium">{label}</div>
    </div>
  )
}

// --- Main Landing Page Component ---
export default function LandingPageClient() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#0E0C0B', fontFamily: "'Sarabun', system-ui, sans-serif" }}>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* Navbar */}
      <nav style={{ backdropFilter: scrolled ? 'blur(20px)' : 'none', background: scrolled ? 'rgba(14,12,11,0.85)' : 'transparent', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none' }} className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#D4622B] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-orange-900/40">Q</div>
          <span className="text-white font-bold text-lg tracking-tight">QR ออร์เดอร์</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a>
          <a href="#howto" className="hover:text-white transition-colors">วิธีใช้</a>
          <a href="#demo" className="hover:text-white transition-colors">ทดลองใช้</a>
        </div>
        <a href="/menu?token=tok_dev_table_01_xxxxxxxxxx" className="bg-[#D4622B] text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-[#BF5424] transition-colors shadow-lg shadow-orange-900/30 active:scale-95">
          ทดลองเลย →
        </a>
      </nav>

      {/* === HERO === */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-30" style={{ background: 'radial-gradient(ellipse, #D4622B44 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(ellipse, #E5A84044 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-slate-300 font-medium mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            ระบบพร้อมใช้งาน — ไม่ต้องติดตั้งแอป
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight mb-6">
            สั่งอาหาร<br/>
            <span style={{ background: 'linear-gradient(135deg, #D4622B, #E5A840)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ง่ายแค่สแกน
            </span><br/>
            QR Code
          </h1>

          <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed mb-12">
            ลูกค้าสแกน QR ที่โต๊ะ → เลือกเมนู → สั่งอาหาร<br/>
            <span className="text-slate-500">ไม่ต้องรอพนักงาน ไม่ต้องโหลดแอป</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/menu?token=tok_dev_table_01_xxxxxxxxxx" className="group w-full sm:w-auto bg-[#D4622B] text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-2xl shadow-orange-900/40 hover:bg-[#BF5424] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
              <span className="text-xl">📱</span>
              ทดลองใช้งาน Demo
              <span className="opacity-60 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a href="#features" className="w-full sm:w-auto bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/20 transition-all backdrop-blur-md flex items-center justify-center gap-2">
              ดูฟีเจอร์ทั้งหมด ↓
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-sm text-slate-500">
            {['✓ ไม่ต้องติดตั้งแอป', '✓ รองรับทุก Smartphone', '✓ Real-time อัปเดตทันที', '✓ ปลอดภัย 100%'].map(t => (
              <span key={t} className="flex items-center gap-1.5">{t}</span>
            ))}
          </div>
        </div>

        {/* Floating phone mockup */}
        <div className="relative mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(ellipse, #D4622B30 0%, transparent 60%)', filter: 'blur(30px)', transform: 'scaleX(1.5) scaleY(0.5) translateY(40%)' }} />
          <MockPhone />
        </div>
      </section>

      {/* === STATS === */}
      <section className="py-24 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatBadge value="3 วินาที" label="เวลาเปิดหน้าเมนู" />
            <StatBadge value="0 บาท" label="ค่าแอปสำหรับลูกค้า" />
            <StatBadge value="∞ รอบ" label="สั่งอาหารได้หลายครั้ง" />
            <StatBadge value="Real-time" label="ครัวเห็นทันที" />
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#D4622B] font-bold text-sm uppercase tracking-widest mb-3">ฟีเจอร์</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">ทุกอย่างที่ร้านต้องการ</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">ออกแบบมาเพื่อธุรกิจร้านอาหารโดยเฉพาะ</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={<div className="w-6 h-6"><IconQR /></div>}
              title="QR Code ประจำโต๊ะ"
              desc="แต่ละโต๊ะมี QR ที่ไม่เหมือนกัน สแกนแล้วเข้าสู่เมนูทันที ไม่ต้องล็อกอิน ไม่ต้องสมัคร"
              color="#D4622B"
              delay="0s"
            />
            <FeatureCard
              icon={<div className="w-6 h-6"><IconPhone /></div>}
              title="เมนูดิจิทัลสวยงาม"
              desc="แสดงรูปภาพ คำอธิบาย และป้ายกำกับ (เผ็ด/มังสวิรัติ/แนะนำ) พร้อมระบบค้นหาเมนูแบบ Real-time"
              color="#E5A840"
              delay="0.1s"
            />
            <FeatureCard
              icon={<div className="w-6 h-6"><IconChef /></div>}
              title="จอครัว (Kitchen Display)"
              desc="ครัวเห็นออเดอร์ทันทีที่ลูกค้าสั่ง พร้อมตัวจับเวลาและสีแจ้งเตือนความเร่งด่วน"
              color="#4CAF7D"
              delay="0.2s"
            />
            <FeatureCard
              icon={<div className="w-6 h-6"><IconBell /></div>}
              title="แจ้งเตือน Real-time"
              desc="เรียกพนักงาน ขอเช็คบิล หรือมีออเดอร์ใหม่ — แจ้งเตือนทุกอย่างทันทีโดยไม่ต้องรีเฟรช"
              color="#D4627B"
              delay="0.3s"
            />
            <FeatureCard
              icon={<div className="w-6 h-6"><IconChart /></div>}
              title="แดชบอร์ดผู้จัดการ"
              desc="ดูสถานะโต๊ะทั้งหมด จัดการเมนู แก้ไขราคา Upload รูปภาพอาหาร และออก QR Code ได้เอง"
              color="#6C8EEF"
              delay="0.4s"
            />
            <FeatureCard
              icon={<div className="w-6 h-6"><IconShield /></div>}
              title="ปลอดภัย & เสถียร"
              desc="สร้างบน Supabase ระบบคลาวด์ระดับ Enterprise ข้อมูลลูกค้าถูกปกป้องด้วย Row-Level Security"
              color="#8B5CF6"
              delay="0.5s"
            />
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section id="howto" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 80% 50%, #D4622B30, transparent 60%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-[#D4622B] font-bold text-sm uppercase tracking-widest mb-3">วิธีใช้งาน</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">ง่ายมาก ใน 3 ขั้นตอน</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="space-y-10">
              <Step num="1" title="ลูกค้าสแกน QR บนโต๊ะ" desc="ใช้กล้องมือถือสแกน QR Code ที่ติดไว้บนโต๊ะ เข้าสู่หน้าเมนูทันที ไม่ต้องติดตั้งแอป" accent="#D4622B" />
              <Step num="2" title="เลือกเมนูและสั่งอาหาร" desc="เลือกดูเมนู ใส่ตะกร้า กด 'สั่งอาหาร' ออเดอร์ไปยังครัวทันที สั่งซ้ำได้หลายรอบตลอดมื้อ" accent="#E5A840" />
              <Step num="3" title="ครัวทำอาหาร จ่ายเงิน" desc="ครัวรับออเดอร์ผ่านจอ KDS ทำอาหาร เสร็จแล้วลูกค้ากดขอเช็คบิลได้จากมือถือ" accent="#4CAF7D" />
            </div>

            {/* Use case cards */}
            <div className="space-y-4">
              <UseCaseCard emoji="🍜" title="ร้านอาหารทั่วไป" desc="ลดภาระพนักงานจด order — ไม่ต้องเดินถามซ้ำแล้วซ้ำเล่า" />
              <UseCaseCard emoji="🍣" title="ร้านบุฟเฟ่ต์" desc="ลูกค้าสั่งได้เองไม่จำกัดรอบ ไม่ต้องรอเรียกพนักงาน" />
              <UseCaseCard emoji="☕" title="คาเฟ่" desc="เมนูสวยงามพร้อมรูปภาพ ช่วยตัดสินใจและเพิ่มยอดขาย" />
              <UseCaseCard emoji="🏪" title="ฟู้ดคอร์ท" desc="จัดการหลายโต๊ะพร้อมกัน ลดข้อผิดพลาดจากการสั่งด้วยวาจา" />
            </div>
          </div>
        </div>
      </section>

      {/* === DEMO CTA === */}
      <section id="demo" className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-[40px] p-12 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4622B22, #E5A84018), rgba(255,255,255,0.03)', border: '1px solid rgba(212,98,43,0.3)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, #D4622B30 0%, transparent 60%)', filter: 'blur(20px)' }} />
            <div className="relative">
              <div className="text-6xl mb-6">📱</div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                ลองสัมผัสด้วย<br/>ตัวเองเลย
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                เราเตรียม Demo สำหรับทดลองใช้งานพร้อมแล้ว<br/>
                ลองสั่งอาหาร ดูหน้าครัว และแดชบอร์ดผู้จัดการ
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/menu?token=tok_dev_table_01_xxxxxxxxxx" className="bg-[#D4622B] text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-[#BF5424] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-orange-900/50">
                  🛒 หน้าเมนูลูกค้า
                </a>
                <a href="/kitchen" className="bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/20 transition-all backdrop-blur-md">
                  👨‍🍳 จอครัว KDS
                </a>
                <a href="/admin" className="bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/20 transition-all backdrop-blur-md">
                  ⚙️ แดชบอร์ด Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-[#D4622B] flex items-center justify-center text-white font-black text-xs shadow-lg">Q</div>
          <span className="text-white font-bold">QR ออร์เดอร์</span>
        </div>
        <p className="text-slate-600 text-sm">ระบบสั่งอาหารดิจิทัล สำหรับร้านอาหารยุคใหม่</p>
      </footer>
    </div>
  )
}
