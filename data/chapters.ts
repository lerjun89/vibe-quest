export interface Chapter {
  id: string
  season: number
  num: number
  title: string
  free: boolean
  questCount: number
}

export const CHAPTERS: Chapter[] = [
  { id: 's1-ch01', season: 1, num: 1, title: '검은 화면에서 AI랑 코딩하기', free: true, questCount: 4 },
  { id: 's1-ch02', season: 1, num: 2, title: '개발 환경 준비하기', free: true, questCount: 6 },
  { id: 's1-ch03', season: 1, num: 3, title: '코딩 몰라도 앱 만드는 법', free: true, questCount: 5 },
  { id: 's1-ch04', season: 1, num: 4, title: '주요 AI 코딩 도구들', free: true, questCount: 3 },
  { id: 's1-ch05', season: 1, num: 5, title: '바이브 코딩 핵심 기법', free: true, questCount: 5 },
  { id: 's1-ch06', season: 1, num: 6, title: '배포하기', free: true, questCount: 4 },
  { id: 's1-ch07', season: 1, num: 7, title: 'MCP란 무엇인가', free: true, questCount: 4 },
  { id: 's1-ch08', season: 1, num: 8, title: '유용한 MCP 서버 모음', free: true, questCount: 8 },
]
