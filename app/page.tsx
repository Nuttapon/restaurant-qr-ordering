import type { Metadata } from 'next'
import LandingPageClient from './landing/LandingPageClient'

export const metadata: Metadata = {
  title: 'QR ออร์เดอร์ — ระบบสั่งอาหารผ่าน QR Code สำหรับร้านอาหาร',
  description: 'ระบบสั่งอาหารดิจิทัลผ่าน QR Code ไม่ต้องติดตั้งแอป ลูกค้าสแกน เลือกเมนู สั่งอาหารได้ทันที ลดภาระพนักงาน เพิ่มยอดขาย',
}

export default function RootPage() {
  return <LandingPageClient />
}
