'use client'

import { useState, useRef, useCallback } from 'react'
import { TOOLTIPS } from '@/data/tooltips'

interface TooltipProps {
  term: string
  children: React.ReactNode
}

type Align = 'left' | 'center' | 'right'

const TOOLTIP_W = 272

export default function Tooltip({ term, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [align, setAlign] = useState<Align>('center')
  const triggerRef = useRef<HTMLSpanElement>(null)
  const description = TOOLTIPS[term]

  // 뷰포트 가장자리 감지 → 말풍선 방향 결정
  const calcAlign = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const margin = 12
    const centerLeft = rect.left + rect.width / 2 - TOOLTIP_W / 2
    const centerRight = rect.left + rect.width / 2 + TOOLTIP_W / 2

    if (centerLeft < margin) setAlign('left')
    else if (centerRight > vw - margin) setAlign('right')
    else setAlign('center')
  }, [])

  if (!description) {
    return <strong className="font-bold text-[#eef0ff]">{children}</strong>
  }

  // 말풍선 위치 스타일
  const boxStyle: React.CSSProperties =
    align === 'left'
      ? { left: 0 }
      : align === 'right'
      ? { right: 0 }
      : { left: '50%', transform: 'translateX(-50%)' }

  // 꼬리 위치 스타일
  const arrowStyle: React.CSSProperties =
    align === 'left'
      ? { left: 14 }
      : align === 'right'
      ? { right: 14, left: 'auto' }
      : { left: '50%', transform: 'translateX(-50%)' }

  return (
    <span
      ref={triggerRef}
      className="relative inline"
      onMouseEnter={() => { calcAlign(); setVisible(true) }}
      onMouseLeave={() => setVisible(false)}
      onClick={() => { calcAlign(); setVisible(v => !v) }}
    >
      {/* 하이라이트 텍스트 */}
      <span
        className="cursor-help font-semibold px-0.5 rounded-sm"
        style={{
          background: 'rgba(245,200,66,0.15)',
          borderBottom: '2px solid #f5c842',
          color: '#f5c842',
          transition: 'background .15s',
        }}
      >
        {children}
      </span>

      {/* 말풍선 */}
      {visible && (
        <span
          className="absolute z-50 bottom-full mb-2 rounded-xl text-sm shadow-2xl"
          style={{
            ...boxStyle,
            width: TOOLTIP_W,
            padding: '12px 14px',
            background: '#0d1020',
            border: '1px solid rgba(245,200,66,0.5)',
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(245,200,66,.1)',
          }}
        >
          {/* 용어명 */}
          <span
            className="block font-bold mb-1.5"
            style={{ color: '#f5c842', fontFamily: "'Exo 2', sans-serif", fontSize: 12, letterSpacing: '.06em' }}
          >
            {term}
          </span>
          {/* 설명 */}
          <span style={{ color: '#8892bb', fontSize: 12, lineHeight: 1.65 }}>
            {description}
          </span>
          {/* 꼬리 삼각형 */}
          <span
            className="absolute top-full w-0 h-0"
            style={{
              ...arrowStyle,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid rgba(245,200,66,0.5)',
            }}
          />
        </span>
      )}
    </span>
  )
}
