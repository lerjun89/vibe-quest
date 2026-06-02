import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '선물조각 — 조각을 모아 선물을 완성해요',
  description: '생일자가 원하는 선물 링크를 등록하면, 친구들이 조각을 선물하며 펀딩에 참여하는 생일 선물 펀딩 서비스',
}

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="light"
      style={{
        minHeight: '100vh',
        background: '#fff',
        color: '#111111',
        colorScheme: 'light',
      }}
      className="gift-root"
    >
      {children}
    </div>
  )
}
