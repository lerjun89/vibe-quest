'use client'

import React, { useEffect, useRef, useState } from 'react'
import Tooltip from './Tooltip'
import { TOOLTIPS } from '@/data/tooltips'

// ── 인라인 파서 ──────────────────────────────────────────────
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
    if (m.index > 0) result.push(<React.Fragment key={k++}>{remaining.slice(0, m.index)}</React.Fragment>)
    const term = m[1]
    if (TOOLTIPS[term]) {
      result.push(<Tooltip key={k++} term={term}>{term}</Tooltip>)
    } else {
      result.push(
        <strong key={k++} style={{ fontWeight: 700, color: 'var(--text1)' }}>{term}</strong>
      )
    }
    remaining = remaining.slice(m.index + m[0].length)
  }
  return result
}

// ── 토큰 타입 ────────────────────────────────────────────────
type CalloutType = 'tip' | 'warn' | 'danger' | 'ok' | 'info'

type Token =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'callout'; ctype: CalloutType; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; lines: string[] }
  | { type: 'hr' }

type ContentToken = Exclude<Token, { type: 'h2' } | { type: 'h3' }>

// ── 콜아웃 감지 ──────────────────────────────────────────────
const CALLOUT_TRIGGERS: Record<CalloutType, string[]> = {
  tip:    ['💡'],
  warn:   ['⚠️'],
  danger: ['🔐', '🚨'],
  ok:     ['✅', '🎉'],
  info:   ['🔮', '📌'],
}

function detectCallout(text: string): { ctype: CalloutType; rest: string } | null {
  for (const [ctype, emojis] of Object.entries(CALLOUT_TRIGGERS) as [CalloutType, string[]][]) {
    for (const e of emojis) {
      if (text.startsWith(e)) return { ctype, rest: text.slice(e.length).trim() }
    }
  }
  return null
}

// ── 토크나이저 ───────────────────────────────────────────────
function tokenize(content: string): Token[] {
  const tokens: Token[] = []
  const segments = content.split(/(```[\s\S]*?```)/g)

  for (const seg of segments) {
    if (seg.startsWith('```') && seg.endsWith('```')) {
      const inner = seg.slice(3, -3)
      const nl = inner.indexOf('\n')
      tokens.push({
        type: 'code',
        lang: nl > -1 ? inner.slice(0, nl).trim() : '',
        code: nl > -1 ? inner.slice(nl + 1).trimEnd() : inner.trimEnd(),
      })
      continue
    }

    const lines = seg.split('\n')
    let i = 0
    let listItems: string[] = []
    let tableLines: string[] = []

    const flushList = () => {
      if (listItems.length) { tokens.push({ type: 'list', items: [...listItems] }); listItems = [] }
    }
    const flushTable = () => {
      if (tableLines.length >= 2) tokens.push({ type: 'table', lines: [...tableLines] })
      tableLines = []
    }

    while (i < lines.length) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList(); tableLines.push(line); i++; continue
      } else if (tableLines.length) flushTable()

      if (line.startsWith('## ')) {
        flushList(); tokens.push({ type: 'h2', text: line.slice(3) })
      } else if (line.startsWith('### ')) {
        flushList(); tokens.push({ type: 'h3', text: line.slice(4) })
      } else if (line.startsWith('> ')) {
        flushList()
        const text = line.slice(2).trim()
        const detected = detectCallout(text)
        if (detected) tokens.push({ type: 'callout', ctype: detected.ctype, text: detected.rest })
        else tokens.push({ type: 'blockquote', text })
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        listItems.push(line.slice(2))
      } else if (trimmed === '---') {
        flushList(); tokens.push({ type: 'hr' })
      } else if (trimmed !== '') {
        flushList(); tokens.push({ type: 'p', text: line })
      } else {
        flushList()
      }
      i++
    }
    flushList()
    if (tableLines.length) flushTable()
  }
  return tokens
}

// ── 섹션 그루핑 ──────────────────────────────────────────────
type H3Section = { heading: string; tokens: ContentToken[] }
type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'content'; tokens: ContentToken[] }
  | { kind: 'cards'; sections: H3Section[] }   // 항상 최대 2개씩

function groupBlocks(tokens: Token[]): Block[] {
  const blocks: Block[] = []
  let i = 0

  while (i < tokens.length) {
    const tok = tokens[i]

    if (tok.type === 'h2') {
      blocks.push({ kind: 'h2', text: tok.text }); i++; continue
    }

    if (tok.type === 'h3') {
      // h3 섹션들을 최대 2개씩 페어로 묶음
      while (i < tokens.length && tokens[i].type === 'h3') {
        const pair: H3Section[] = []
        // 최대 2개만 한 쌍으로
        for (let p = 0; p < 2 && i < tokens.length && tokens[i].type === 'h3'; p++) {
          const heading = (tokens[i] as { type: 'h3'; text: string }).text
          i++
          const content: ContentToken[] = []
          while (i < tokens.length && tokens[i].type !== 'h2' && tokens[i].type !== 'h3') {
            content.push(tokens[i] as ContentToken)
            i++
          }
          pair.push({ heading, tokens: content })
        }
        blocks.push({ kind: 'cards', sections: pair })
      }
      continue
    }

    const content: ContentToken[] = []
    while (i < tokens.length && tokens[i].type !== 'h2' && tokens[i].type !== 'h3') {
      content.push(tokens[i] as ContentToken); i++
    }
    if (content.length) blocks.push({ kind: 'content', tokens: content })
  }

  return blocks
}

// ── 코드 블록 ────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="code-wrap" style={{ margin: '14px 0' }}>
      <div className="code-header">
        <span className="code-lang">{lang || 'shell'}</span>
        <button
          className={`code-copy${copied ? ' copied' : ''}`}
          onClick={() => {
            navigator.clipboard.writeText(code).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? '✓ 복사됨' : '복사'}
        </button>
      </div>
      <pre className="code-pre"><code>{code}</code></pre>
    </div>
  )
}

// ── 표 ───────────────────────────────────────────────────────
function TableBlock({ lines }: { lines: string[] }) {
  const parseRow = (line: string) =>
    line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
  const headers = parseRow(lines[0])
  const rows = lines.slice(2).map(parseRow)
  return (
    <div className="cmp-table-wrap" style={{ margin: '14px 0' }}>
      <table>
        <thead><tr>{headers.map((h, i) => <th key={i}>{parseInline(h, i)}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{parseInline(cell, ri * 10 + ci)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 콘텐츠 토큰 렌더러 ───────────────────────────────────────
const CALLOUT_ICON: Record<CalloutType, string> = {
  tip: '💡', warn: '⚠️', danger: '🚨', ok: '✅', info: '🔮',
}

function RenderTokens({ tokens, keyBase = 0 }: { tokens: ContentToken[]; keyBase?: number }) {
  return (
    <>
      {tokens.map((tok, i) => {
        const k = keyBase * 1000 + i
        if (tok.type === 'p') return (
          <p key={k} style={{ fontSize: 15, lineHeight: 2.0, color: 'var(--text2)', marginBottom: 12 }}>
            {parseInline(tok.text, k * 100)}
          </p>
        )
        if (tok.type === 'list') return (
          <ul key={k} style={{ margin: '8px 0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tok.items.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', gap: 10, fontSize: 15, lineHeight: 1.85, color: 'var(--text2)' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--gold2)', border: '1px solid rgba(245,200,66,.3)',
                  color: 'var(--gold)', fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  {idx + 1}
                </span>
                <span>{parseInline(item, k * 100 + idx)}</span>
              </li>
            ))}
          </ul>
        )
        if (tok.type === 'code') return <CodeBlock key={k} code={tok.code} lang={tok.lang} />
        if (tok.type === 'table') return <TableBlock key={k} lines={tok.lines} />
        if (tok.type === 'callout') return (
          <div key={k} className={`callout ${tok.ctype}`} style={{ margin: '14px 0', fontSize: 14, lineHeight: 1.85 }}>
            <span className="callout-icon" style={{ fontSize: 18 }}>{CALLOUT_ICON[tok.ctype]}</span>
            <div>{parseInline(tok.text, k * 100)}</div>
          </div>
        )
        if (tok.type === 'blockquote') return (
          <blockquote key={k} className="quest-blockquote" style={{ fontSize: 14, lineHeight: 1.85 }}>
            {parseInline(tok.text, k * 100)}
          </blockquote>
        )
        if (tok.type === 'hr') return (
          <hr key={k} className="quest-divider" />
        )
        return null
      })}
    </>
  )
}

// ── 카드 색상 ─────────────────────────────────────────────────
const CARD_ACCENTS = [
  { color: '#00e5ff',   bgDark: 'rgba(0,229,255,.08)',   bgLight: 'rgba(0,134,204,.06)',   border: 'rgba(0,229,255,.3)' },
  { color: '#b060ff',   bgDark: 'rgba(176,96,255,.08)',  bgLight: 'rgba(124,58,237,.06)',  border: 'rgba(176,96,255,.3)' },
  { color: '#f5c842',   bgDark: 'rgba(245,200,66,.08)',  bgLight: 'rgba(200,146,10,.06)',  border: 'rgba(245,200,66,.3)' },
  { color: '#39ff85',   bgDark: 'rgba(57,255,133,.08)',  bgLight: 'rgba(10,138,74,.06)',   border: 'rgba(57,255,133,.3)' },
  { color: '#ff4d6d',   bgDark: 'rgba(255,77,109,.08)',  bgLight: 'rgba(214,51,85,.06)',   border: 'rgba(255,77,109,.3)' },
]

// ── H3 카드 ──────────────────────────────────────────────────
function H3Card({ section, index, total }: { section: H3Section; index: number; total: number }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: accent.bgDark,
      border: `1px solid ${accent.border}`,
      borderLeft: `4px solid ${accent.color}`,
      borderRadius: 14,
      padding: '20px 20px 22px',
    }}>
      {/* 섹션 헤딩 */}
      <div style={{
        fontSize: total === 1 ? 16 : 14,
        fontWeight: 800,
        color: accent.color,
        marginBottom: 14,
        lineHeight: 1.4,
        letterSpacing: '-.01em',
      }}>
        {parseInline(section.heading, index * 1000)}
      </div>
      <RenderTokens tokens={section.tokens} keyBase={index} />
    </div>
  )
}

// ── 블록 렌더러 ──────────────────────────────────────────────
function RenderBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        // h2 — 섹션 구분자
        if (block.kind === 'h2') return (
          <div key={i} style={{ margin: '32px 0 20px', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text1)',
              letterSpacing: '-.01em',
              lineHeight: 1.4,
            }}>
              {parseInline(block.text, i * 1000)}
            </h2>
          </div>
        )

        // 단독 컨텐츠
        if (block.kind === 'content') return (
          <div key={i} style={{ margin: '6px 0 16px' }}>
            <RenderTokens tokens={block.tokens} keyBase={i} />
          </div>
        )

        // 카드 그룹 (h3 섹션들)
        if (block.kind === 'cards') {
          const { sections } = block
          if (sections.length === 1) {
            return (
              <div key={i} style={{ margin: '16px 0' }}>
                <H3Card section={sections[0]} index={0} total={1} />
              </div>
            )
          }
          // 항상 최대 2개이므로 무조건 2컬럼
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                margin: '16px 0',
              }}
            >
              {sections.map((s, si) => (
                <H3Card key={si} section={s} index={si} total={sections.length} />
              ))}
            </div>
          )
        }

        return null
      })}
    </>
  )
}

// ── 스크롤 리빌 ──────────────────────────────────────────────
function useScrollReveal(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = el.querySelectorAll<HTMLElement>('.reveal')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    )
    targets.forEach(t => io.observe(t))
    return () => io.disconnect()
  }, [ref])
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function QuestText({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollReveal(ref)
  const tokens = tokenize(content)
  const blocks = groupBlocks(tokens)

  return (
    <div ref={ref} style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
      <RenderBlocks blocks={blocks} />
    </div>
  )
}
