import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '선물조각 — 조각을 모아 선물을 완성해요',
  description: '생일 선물 펀딩 서비스',
}

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="light"
      className="gift-root"
      style={{ minHeight: '100vh', background: '#fff', color: '#111111' }}
    >
      {children}
    </div>
  )
}
