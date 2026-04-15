'use client'

import React, { useState, useEffect, useRef } from 'react'
import Tooltip from './Tooltip'
import { TOOLTIPS } from '@/data/tooltips'

// ── 인라인 파서: **term** → Tooltip 또는 bold ────────────────
function parseInline(text: string, baseKey = 0): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let remaining = text
  let k = baseKey

  while (remaining.length > 0) {
    const m = remaining.match(/\*\*([^*]+)\*\*/)
    if (!m || m.index === undefined) {
      if (remaining) result.push(<React.Fragment key={k++}>{remaining}</React.Fragment>)
      break
    }
    if (m.index > 0) {
      result.push(<React.Fragment key={k++}>{remaining.slice(0, m.index)}</React.Fragment>)
    }
    const term = m[1]
    if (TOOLTIPS[term]) {
      result.push(<Tooltip key={k++} term={term}>{term}</Tooltip>)
    } else {
      result.push(
        <strong key={k++} style={{ fontWeight: 600, color: '#eef0ff' }}>{term}</strong>
      )
    }
    remaining = remaining.slice(m.index + m[0].length)
  }
  return result
}

// ── 코드 블록 컴포넌트 ───────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-wrap reveal">
      <div className="code-header">
        <span className="code-lang">{lang || 'shell'}</span>
        <button
          className={`code-copy${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '✓ 복사됨' : '복사'}
        </button>
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ── 콜아웃 컴포넌트 ─────────────────────────────────────────
type CalloutType = 'tip' | 'warn' | 'danger' | 'ok' | 'info'

const CALLOUT_META: Record<CalloutType, { icon: string; triggerEmoji: string[] }> = {
  tip:    { icon: '💡', triggerEmoji: ['💡'] },
  warn:   { icon: '⚠️', triggerEmoji: ['⚠️'] },
  danger: { icon: '🚨', triggerEmoji: ['🔐', '🚨'] },
  ok:     { icon: '✅', triggerEmoji: ['✅', '🎉'] },
  info:   { icon: '🔮', triggerEmoji: ['🔮', '📌'] },
}

function detectCalloutType(text: string): { type: CalloutType; rest: string } | null {
  for (const [type, meta] of Object.entries(CALLOUT_META) as [CalloutType, typeof CALLOUT_META[CalloutType]][]) {
    for (const emoji of meta.triggerEmoji) {
      if (text.startsWith(emoji)) {
        return { type, rest: text.slice(emoji.length).trim() }
      }
    }
  }
  return null
}

function Callout({ type, children }: { type: CalloutType; children: React.ReactNode }) {
  return (
    <div className={`callout ${type} reveal`}>
      <span className="callout-icon">{CALLOUT_META[type].icon}</span>
      <div>{children}</div>
    </div>
  )
}

// ── 표 렌더링 ────────────────────────────────────────────────
function TableBlock({ lines, baseKey }: { lines: string[]; baseKey: number }) {
  if (lines.length < 2) return null

  const parseRow = (line: string) =>
    line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())

  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)

  return (
    <div className="cmp-table-wrap reveal">
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{parseInline(h, baseKey * 100 + i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{parseInline(cell, baseKey * 100 + ri * 10 + ci)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 메인 파서 ────────────────────────────────────────────────
function parseContent(content: string): React.ReactNode[] {
  // Pass 1: 코드 펜스 분리
  const segments = content.split(/(```[\s\S]*?```)/g)
  const result: React.ReactNode[] = []
  let key = 0

  for (const segment of segments) {
    if (segment.startsWith('```') && segment.endsWith('```')) {
      const inner = segment.slice(3, -3)
      const nlIdx = inner.indexOf('\n')
      const lang = nlIdx > -1 ? inner.slice(0, nlIdx).trim() : ''
      const code = nlIdx > -1 ? inner.slice(nlIdx + 1).trimEnd() : inner.trimEnd()
      result.push(<CodeBlock key={key++} code={code} lang={lang} />)
      continue
    }

    // Pass 2: 줄 단위 파싱
    const lines = segment.split('\n')
    let i = 0
    let listItems: string[] = []
    let tableLines: string[] = []

    const flushList = () => {
      if (listItems.length === 0) return
      result.push(
        <ul key={key++} className="quest-list reveal">
          {listItems.map((item, idx) => (
            <li key={idx} className="quest-list-item">
              <span className="quest-list-bullet">▸</span>
              <span>{parseInline(item, key * 1000 + idx)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }

    const flushTable = () => {
      if (tableLines.length < 2) { tableLines = []; return }
      result.push(<TableBlock key={key++} lines={tableLines} baseKey={key} />)
      tableLines = []
    }

    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      // 표 감지
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList()
        tableLines.push(line)
        i++
        continue
      } else if (tableLines.length > 0) {
        flushTable()
      }

      // h2
      if (line.startsWith('## ')) {
        flushList()
        const text = line.slice(3)
        result.push(
          <h2
            key={key++}
            className="reveal"
            style={{
              fontFamily: "var(--font-exo2, 'Exo 2'), var(--font-geist-sans), sans-serif",
              fontSize: 18,
              fontWeight: 900,
              color: 'var(--gold)',
              borderBottom: '1px solid rgba(245,200,66,.15)',
              paddingBottom: 10,
              marginTop: 32,
              marginBottom: 16,
              letterSpacing: '.04em',
            }}
          >
            {parseInline(text, key * 1000)}
          </h2>
        )
      }
      // h3
      else if (line.startsWith('### ')) {
        flushList()
        const text = line.slice(4)
        result.push(
          <h3
            key={key++}
            className="reveal"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text1)',
              marginTop: 22,
              marginBottom: 8,
            }}
          >
            {parseInline(text, key * 1000)}
          </h3>
        )
      }
      // 인용 / 콜아웃
      else if (line.startsWith('> ')) {
        flushList()
        const text = line.slice(2).trim()
        const detected = detectCalloutType(text)
        if (detected) {
          result.push(
            <Callout key={key++} type={detected.type}>
              {parseInline(detected.rest, key * 1000)}
            </Callout>
          )
        } else {
          result.push(
            <blockquote key={key++} className="quest-blockquote reveal">
              {parseInline(text, key * 1000)}
            </blockquote>
          )
        }
      }
      // 불릿 리스트
      else if (line.startsWith('- ') || line.startsWith('• ')) {
        listItems.push(line.slice(2))
      }
      // 구분선
      else if (trimmed === '---') {
        flushList()
        result.push(<hr key={key++} className="quest-divider" />)
      }
      // 빈 줄
      else if (trimmed === '') {
        flushList()
      }
      // 일반 단락
      else {
        flushList()
        result.push(
          <p
            key={key++}
            className="reveal"
            style={{
              fontSize: 13,
              lineHeight: 1.85,
              color: 'var(--text2)',
              marginBottom: 6,
            }}
          >
            {parseInline(line, key * 1000)}
          </p>
        )
      }

      i++
    }

    flushList()
    if (tableLines.length > 0) flushTable()
  }

  return result
}

// ── 스크롤 리빌 훅 ───────────────────────────────────────────
function useScrollReveal(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const targets = el.querySelectorAll<HTMLElement>('.reveal')

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    )

    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [containerRef])
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export default function QuestText({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollReveal(ref)

  const nodes = parseContent(content)

  return (
    <div ref={ref} className="quest-text" style={{ fontSize: 13, lineHeight: 1.8 }}>
      {nodes}
    </div>
  )
}
