export interface Quiz {
  question: string
  options: string[]
  answer: number // 0-based index
  explanation: string
}

export interface Quest {
  id: string
  chapterId: string
  num: number
  title: string
  content: string
  quiz: Quiz
}

export const QUESTS: Quest[] = [
  // ───────────── 시즌1 챕터1 ─────────────
  {
    id: 's1-ch01-q01',
    chapterId: 's1-ch01',
    num: 1,
    title: 'CLI vs GUI — 두 가지 방법',
    content: `## 두 가지 방법으로 컴퓨터에 명령하기

컴퓨터에게 일을 시키는 방법은 크게 두 가지야.

### **GUI** — 눈에 보이는 방법
**GUI**(그래픽 사용자 인터페이스)는 마우스로 아이콘을 클릭하고, 버튼을 누르는 방식이야. 우리가 평소에 쓰는 방식이지. 파일 탐색기, 카카오톡, 게임 런처 — 전부 **GUI**야.

### **CLI** — 글자로 명령하는 방법
**CLI**(커맨드 라인 인터페이스)는 검은 화면에서 글자를 직접 입력해서 컴퓨터에게 명령하는 방식이야. **터미널**을 열면 만나는 그 화면!

\`\`\`
> mkdir my-project
> cd my-project
> ls
\`\`\`

처음엔 무서워 보이지만, 이게 바로 AI랑 코딩할 때 **제일 강력한 환경**이야.

### 왜 **CLI**가 더 좋을까?

**GUI**는 만든 사람이 버튼을 만들어둔 것만 클릭할 수 있어. 하지만 **CLI**는 내가 원하는 걸 **직접 글자로** 지시할 수 있지.

AI 코딩 도구(Claude Code, **Gemini CLI** 등)는 전부 **CLI** 환경에서 돌아가. AI한테 "이 폴더에 파일 만들어줘"라고 말하면 AI가 **CLI** 명령어를 대신 실행해주거든!`,
    quiz: {
      question: 'GUI와 CLI의 가장 큰 차이점은 무엇일까요?',
      options: [
        'GUI는 빠르고, CLI는 느리다',
        'GUI는 마우스로 클릭하고, CLI는 글자로 명령한다',
        'GUI는 개발자만 쓰고, CLI는 누구나 쓴다',
        'GUI는 무료이고, CLI는 유료이다',
      ],
      answer: 1,
      explanation: '정답! GUI는 버튼/아이콘을 마우스로 클릭하는 방식이고, CLI는 검은 화면(터미널)에 글자로 명령을 입력하는 방식이에요. AI 코딩 도구들은 CLI 환경에서 동작해요!',
    },
  },
  {
    id: 's1-ch01-q02',
    chapterId: 's1-ch01',
    num: 2,
    title: 'CLI를 써야 하는 5가지 이유',
    content: `## 왜 **CLI**로 코딩해야 할까?

처음 배울 때 **GUI** 개발 도구를 쓰고 싶을 수도 있어. 하지만 AI랑 코딩할 때는 **CLI**가 훨씬 유리해. 5가지 이유를 알아보자!

### 1. 원래 도구를 그대로 쓸 수 있어
**VS Code**, **Git**, **Node.js** — 개발자들이 원래 쓰던 도구를 그대로 써. 새 도구 배울 필요 없어!

### 2. 가볍고 빠르게 실행돼
무거운 앱 없이 **터미널** 하나면 충분해. 노트북 배터리도 아끼고, 속도도 빠르지.

### 3. AI가 컴퓨터를 직접 조종해
Claude Code 같은 AI 코딩 도구는 **CLI**를 통해 파일을 만들고, 코드를 실행하고, 에러를 고쳐. AI의 손발이 되는 거야!

### 4. 자동화가 쉬워
**터미널**에서 명령어를 연결하면 반복 작업을 자동화할 수 있어. 버튼 100번 클릭하는 일을 명령어 한 줄로!

### 5. 무슨 일이 일어나는지 다 보여
**GUI**는 뒤에서 무슨 일이 생기는지 숨겨. **CLI**는 모든 과정이 눈앞에 펼쳐져서 에러가 나도 원인을 파악하기 쉬워.

> 💡 **요약**: 원래도구유지 + 가볍고빠름 + AI직접조종 + 자동화 + 다볼수있어`,
    quiz: {
      question: 'AI 코딩 도구(Claude Code 등)가 CLI 환경에서 동작하는 가장 큰 이유는?',
      options: [
        'CLI가 더 예쁘게 생겼기 때문에',
        'AI가 CLI를 통해 파일 생성, 코드 실행 등을 직접 조종할 수 있기 때문에',
        'CLI가 GUI보다 인터넷 속도가 빠르기 때문에',
        'GUI 환경에서는 TypeScript를 못 쓰기 때문에',
      ],
      answer: 1,
      explanation: '정답! AI 코딩 도구는 CLI를 통해 파일 만들기, 코드 실행, 에러 수정 등을 직접 처리해요. 이게 바로 AI의 "손발" 역할을 하는 Function Calling이에요!',
    },
  },
  {
    id: 's1-ch01-q03',
    chapterId: 's1-ch01',
    num: 3,
    title: 'VS Code가 기본값인 이유',
    content: `## **VS Code** — 전 세계 개발자의 선택

코드 에디터는 정말 많아. Vim, Emacs, Sublime Text, IntelliJ... 그런데 왜 **VS Code**가 기본값이 됐을까?

### 전 세계 개발자 70%가 선택했어
Stack Overflow 개발자 설문조사 결과야. 10명 중 7명이 **VS Code**를 쓰고 있다는 뜻. 도움받기도 쉽고, 관련 자료도 제일 많아.

### 완전 무료야
Microsoft가 만들었지만 오픈소스로 무료 배포해. 학생이든, 취미 개발자든, 프로 개발자든 모두 같은 도구를 써.

### 레고처럼 기능을 추가할 수 있어
**VS Code**는 **패키지** 설치하듯 확장 프로그램을 설치할 수 있어. Python 지원, Git 시각화, AI 어시스턴트... 내가 원하는 기능만 쏙쏙 추가!

### Claude Code는 VS Code를 그대로 써
**Claude Code**는 별도의 에디터가 아니야. **VS Code**를 그대로 쓰면서 **터미널**에서 Claude Code를 실행하면 돼. 새 에디터 배울 필요 없어!

> 🔮 참고: **Cursor**는 **VS Code** 기반 AI 에디터야. 나중에 익숙해지면 갈아타도 돼. 하지만 지금은 **VS Code** + Claude Code 조합이 최고!`,
    quiz: {
      question: 'VS Code를 기본 코드 에디터로 추천하는 가장 중요한 이유는?',
      options: [
        '유료라서 품질이 좋기 때문에',
        '전 세계 개발자 70%가 사용하며, 무료이고, 확장 프로그램으로 기능 추가가 자유롭기 때문에',
        '윈도우에서만 작동하기 때문에',
        'AI 코딩 도구가 VS Code 없이는 실행이 안 되기 때문에',
      ],
      answer: 1,
      explanation: '정답! VS Code는 무료이고 전 세계 개발자의 70%가 사용하며, 레고처럼 확장 프로그램으로 기능을 추가할 수 있어요. Claude Code도 VS Code 터미널에서 그대로 실행돼요!',
    },
  },
  {
    id: 's1-ch01-q04',
    chapterId: 's1-ch01',
    num: 4,
    title: '주요 AI 코딩 도구들 소개',
    content: `## AI 코딩 도구 전쟁 중!

지금 AI 코딩 도구가 엄청 빠르게 발전하고 있어. 어떤 것들이 있는지 알아보자.

### Claude Code (Anthropic)
이 강의에서 메인으로 쓰는 도구야. **터미널**에서 실행하고, AI가 직접 파일을 만들고 코드를 수정해줘. **에이전트** 방식이라 "이런 앱 만들어줘"라고 하면 알아서 척척 해결해.

### Gemini CLI (Google)
구글이 만든 **CLI** 기반 AI 코딩 도구. Claude Code랑 비슷한 방식으로 동작해. **무료 플랜**이 넉넉해서 입문자한테 좋아.

### Codex CLI (OpenAI)
ChatGPT 만든 OpenAI의 **CLI** 도구. GPT 모델을 **터미널**에서 직접 써서 코딩하는 방식.

### Aider
오픈소스 AI 코딩 도구. **Git**과 연동이 잘 돼서 버전 관리하면서 코딩하기 좋아.

### Cline (VS Code 확장)
**VS Code** 안에서 바로 쓸 수 있는 AI 코딩 도구. 에디터 떠나지 않고 AI랑 대화할 수 있어.

---

> 💡 **어떤 걸 써야 할까?** 지금은 **Claude Code**로 시작해봐. 나중에 여러 도구를 비교해보고 본인한테 맞는 걸 고르면 돼!`,
    quiz: {
      question: '다음 AI 코딩 도구 중 VS Code 확장 프로그램 형태로 제공되는 것은?',
      options: [
        'Claude Code',
        'Gemini CLI',
        'Aider',
        'Cline',
      ],
      answer: 3,
      explanation: '정답! Cline은 VS Code 확장 프로그램으로 설치해서 에디터 안에서 바로 AI와 대화할 수 있어요. Claude Code, Gemini CLI, Codex CLI는 터미널(CLI)에서 실행하는 방식이에요.',
    },
  },

  // ───────────── 시즌1 챕터2 ─────────────
  {
    id: 's1-ch02-q01',
    chapterId: 's1-ch02',
    num: 1,
    title: 'Node.js 설치하기',
    content: `## **Node.js** — 코드를 실행하는 오븐

**Node.js**가 뭔지 모르면 설치할 이유가 없잖아. 먼저 비유로 이해해보자.

### 피자 오븐 비유
피자 도우(코드)를 구우려면 오븐(실행 환경)이 필요해. **Node.js**는 자바스크립트 코드를 실행하는 **오븐**이야.

Claude Code는 자바스크립트로 만들어진 프로그램이라 **Node.js** 없이는 실행이 안 돼!

### nvm으로 설치하는 게 좋아
**Node.js**를 직접 설치해도 되지만, **nvm**(Node Version Manager)으로 설치하면 버전 관리가 쉬워져.

**Windows:**
\`\`\`
# nvm-windows 설치 후:
nvm install 22
nvm use 22
\`\`\`

**Mac/Linux:**
\`\`\`
# Homebrew로 nvm 설치 후:
nvm install 22
nvm use 22
\`\`\`

### 설치 확인
\`\`\`
node --version
# v22.x.x 나오면 성공!

npm --version
# 10.x.x 나오면 성공!
\`\`\`

**npm**은 **Node.js** 설치하면 자동으로 같이 설치돼. **패키지** 설치할 때 쓰는 도구야.

> 💡 **팁**: LTS(Long Term Support) 버전을 설치하는 게 안전해. 22버전이면 딱 좋아!`,
    quiz: {
      question: 'Node.js가 필요한 이유는 무엇인가요?',
      options: [
        '인터넷을 빠르게 만들어주기 때문에',
        'Claude Code를 포함한 자바스크립트 기반 프로그램을 실행하는 환경이기 때문에',
        '파일을 압축하고 해제하는 도구이기 때문에',
        '윈도우 업데이트를 도와주는 프로그램이기 때문에',
      ],
      answer: 1,
      explanation: '정답! Node.js는 자바스크립트 코드를 실행하는 환경(런타임)이에요. Claude Code가 자바스크립트로 만들어졌기 때문에 Node.js 없이는 실행이 안 돼요. 피자를 굽는 오븐 같은 역할!',
    },
  },
  {
    id: 's1-ch02-q02',
    chapterId: 's1-ch02',
    num: 2,
    title: 'Python 설치하기',
    content: `## **Python** — AI 도구를 위한 건식 오븐

**Node.js**가 일반 오븐이라면, **Python**은 건식 오븐이야. 용도가 달라!

### Python이 필요한 경우
- AI/머신러닝 관련 도구
- 자동화 스크립트
- 데이터 분석 도구
- Playwright 같은 테스트 도구

Claude Code 자체는 **Python** 없어도 돼. 하지만 나중에 AI 관련 다양한 도구를 쓰려면 설치해두는 게 좋아.

### 설치 방법

**Windows:**
Microsoft Store에서 **Python** 검색해서 설치하거나:
\`\`\`
# 공식 사이트 python.org에서 다운로드
# 설치 시 "Add Python to PATH" 체크 필수!
\`\`\`

**Mac:**
\`\`\`
# Homebrew로 설치
brew install python3
\`\`\`

### 설치 확인
\`\`\`
python --version
# Python 3.x.x 나오면 성공!

pip --version
# pip 24.x.x 나오면 성공!
\`\`\`

**pip**은 **Python** 패키지 관리자야. **npm**의 Python 버전이라고 생각해!

> ⚠️ **주의**: Python 2 말고 Python **3**을 설치해야 해. 2는 구버전이라 대부분의 도구가 안 돼!`,
    quiz: {
      question: 'pip는 어떤 역할을 하는 도구인가요?',
      options: [
        'Python을 실행하는 오븐 역할',
        'Python 패키지(라이브러리)를 설치하고 관리하는 도구',
        '코드 오류를 자동으로 수정하는 도구',
        '파이썬 코드를 자바스크립트로 변환하는 도구',
      ],
      answer: 1,
      explanation: '정답! pip는 Python의 패키지 관리자예요. npm이 Node.js 패키지를 관리하듯, pip는 Python 패키지(라이브러리)를 설치하고 관리해요. pip install requests처럼 사용해요!',
    },
  },
  {
    id: 's1-ch02-q03',
    chapterId: 's1-ch02',
    num: 3,
    title: 'Git 설치하기',
    content: `## **Git** — 게임 세이브 포인트

코딩하다가 뭔가 망가지면? 세이브 파일로 되돌리면 되지! **Git**이 바로 그 역할이야.

### 게임 세이브 포인트 비유
RPG 게임에서 보스 전 세이브 포인트를 찍어두는 것처럼, **Git**은 코드의 특정 시점을 저장해둬. 나중에 실수해도 저장했던 시점으로 돌아갈 수 있어!

### Git 기본 개념
- **저장소(레포)**: 코드와 히스토리가 저장되는 폴더
- **커밋 메시지**: 세이브 파일에 남기는 메모 ("로그인 기능 추가")
- **브랜치**: 원본 건드리지 않고 새 기능 실험하는 공간
- **GitHub**: **Git** 저장소를 클라우드에 올려두는 서비스

### 설치 방법

**Windows:**
\`\`\`
# git-scm.com에서 다운로드 & 설치
# 설치 시 옵션은 기본값으로 해도 OK
\`\`\`

**Mac:**
\`\`\`
brew install git
\`\`\`

### 설치 확인
\`\`\`
git --version
# git version 2.x.x 나오면 성공!
\`\`\`

### 첫 설정
\`\`\`
git config --global user.name "내 이름"
git config --global user.email "내 이메일"
\`\`\`

> 💡 **Claude Code와 Git**: Claude Code는 자동으로 코드 변경 시 **커밋 메시지**와 함께 저장해줘. 세이브 포인트를 AI가 대신 찍어주는 거야!`,
    quiz: {
      question: 'Git에서 "브랜치(Branch)"를 사용하는 주된 이유는?',
      options: [
        '코드를 인터넷에 올리기 위해',
        '원본 코드를 건드리지 않고 새 기능을 실험하기 위해',
        '다른 개발자 코드를 복사하기 위해',
        '코드 실행 속도를 높이기 위해',
      ],
      answer: 1,
      explanation: '정답! 브랜치는 원본 코드(main)를 건드리지 않고 새 기능을 개발하거나 실험할 수 있는 분기점이에요. 실험이 성공하면 원본에 합치고, 실패하면 버리면 돼요!',
    },
  },
  {
    id: 's1-ch02-q04',
    chapterId: 's1-ch02',
    num: 4,
    title: '터미널 환경 세팅하기',
    content: `## **터미널** — AI랑 대화하는 창구

**터미널**은 AI와 소통하는 메인 공간이야. 어떤 **터미널**을 쓰느냐가 경험에 큰 영향을 미쳐.

### Windows: Windows Terminal 설치

기본 cmd(명령 프롬프트)는 너무 구식이야. **Windows Terminal**이 훨씬 좋아!

1. Microsoft Store에서 "Windows Terminal" 검색
2. 무료로 설치
3. 기본 프로필을 PowerShell로 설정

**PowerShell** vs **cmd**:
- cmd: 구식, 기능 제한적
- **PowerShell**: 최신, 강력한 기능, Claude Code 추천 환경

### Mac: 기본 Terminal 또는 iTerm2

Mac은 기본 **터미널**도 괜찮아. 더 좋은 경험을 원한다면 **iTerm2** 설치를 추천해.

### 터미널 기본 명령어 연습
\`\`\`
# 현재 폴더 확인
pwd

# 폴더 목록 보기
ls (Mac/Linux) 또는 dir (Windows)

# 폴더 이동
cd 폴더이름

# 새 폴더 만들기
mkdir 새폴더이름

# 파일 내용 보기
cat 파일이름.txt
\`\`\`

> 💡 **팁**: **터미널** 명령어가 무서워도 괜찮아. Claude Code한테 "이 작업 어떻게 해?"라고 물어보면 명령어를 알려줘. 처음엔 그냥 복붙하면서 익히면 돼!`,
    quiz: {
      question: 'Windows에서 cmd(명령 프롬프트) 대신 PowerShell이나 Windows Terminal을 추천하는 이유는?',
      options: [
        'cmd는 유료이고 PowerShell은 무료이기 때문에',
        'cmd는 구식이고 기능이 제한적인 반면, PowerShell은 최신이고 기능이 강력하기 때문에',
        'PowerShell은 자동으로 코드를 작성해주기 때문에',
        'cmd에서는 인터넷 연결이 안 되기 때문에',
      ],
      answer: 1,
      explanation: '정답! cmd는 오래된 명령 프롬프트로 기능이 제한적이에요. PowerShell은 더 강력하고 현대적인 터미널 환경이에요. Windows Terminal은 PowerShell, cmd, WSL 등을 한 곳에서 쓸 수 있는 앱이에요!',
    },
  },
  {
    id: 's1-ch02-q05',
    chapterId: 's1-ch02',
    num: 5,
    title: 'API 키 발급받기',
    content: `## **API 키** — AI 사용 입장권

**API 키**는 AI 서비스를 사용할 수 있는 "입장권"이야. 이게 없으면 Claude Code를 쓸 수 없어!

### 놀이공원 비유
놀이공원 입장에 입장권이 필요하듯, Anthropic의 AI 서비스를 사용하려면 **API 키**가 필요해. 그리고 입장권은 돈을 내야 살 수 있지.

### Anthropic API 키 발급 방법

1. **console.anthropic.com** 접속
2. 회원가입 & 이메일 인증
3. 신용카드 등록 (선불 충전 방식)
4. "Create API Key" 클릭
5. **API 키** 복사해서 안전한 곳에 저장

### 비용 얼마나 들어?
Claude Code는 사용량만큼 비용이 발생해. 처음엔 적게 써서 5달러 정도 충전해보고 감을 익혀봐.

### 절대 지켜야 할 규칙

⚠️ **API 키는 절대 공유하면 안 돼!**
- 코드에 직접 넣지 말 것
- **GitHub**에 올리지 말 것
- 카카오톡/슬랙으로 보내지 말 것

대신 **환경변수**나 **.env 파일**에 저장해.

\`\`\`
# .env 파일에 저장하는 방법
ANTHROPIC_API_KEY=sk-ant-xxxxx

# .gitignore에 .env 추가해서 GitHub 업로드 방지
\`\`\`

> 🔐 **보안 팁**: **API 키**가 유출되면 남이 내 돈으로 AI를 써버릴 수 있어. 꼭 비밀로 관리해!`,
    quiz: {
      question: 'API 키를 안전하게 관리하는 올바른 방법은?',
      options: [
        '코드 파일에 직접 하드코딩해서 편하게 쓴다',
        '.env 파일에 저장하고 .gitignore에 추가해서 GitHub에 올라가지 않게 한다',
        '카카오톡 나에게 보내기로 저장해둔다',
        'README.md 파일에 적어두어 팀원들이 쉽게 찾을 수 있게 한다',
      ],
      answer: 1,
      explanation: '정답! API 키는 .env 파일에 저장하고, .gitignore에 .env를 추가해서 GitHub에 절대 올라가지 않게 해야 해요. API 키가 유출되면 남이 내 돈으로 AI를 써버릴 수 있어요!',
    },
  },
  {
    id: 's1-ch02-q06',
    chapterId: 's1-ch02',
    num: 6,
    title: 'Claude Code 설치하기',
    content: `## Claude Code — AI 친구를 내 컴퓨터에!

드디어 메인 도구 설치야! 모든 환경 준비가 끝났으니 Claude Code를 설치해보자.

### 친구가 방에 오는 비유
Claude Code는 AI 친구가 내 컴퓨터 방에 직접 들어오는 거야. 내 파일을 직접 보고, 수정하고, 실행할 수 있어. "이 기능 만들어줘"라고 말하면 AI가 직접 코딩을 해줘!

### 설치 방법

**npm**으로 글로벌 설치:
\`\`\`
npm install -g @anthropic-ai/claude-code
\`\`\`

설치 확인:
\`\`\`
claude --version
# claude 1.x.x 나오면 성공!
\`\`\`

### API 키 연결

\`\`\`
claude
# 처음 실행하면 API 키를 물어봐
# 발급받은 API 키 입력!
\`\`\`

### 첫 번째 대화!

\`\`\`
> 안녕! 내 컴퓨터에 잘 왔어.
Claude: 안녕하세요! 무엇을 만들어드릴까요?

> 간단한 HTML 파일 하나 만들어줘
Claude: (파일 생성 중...)
\`\`\`

### 유용한 명령어

| 명령어 | 설명 |
|--------|------|
| **/clear** | 대화 초기화 (**토큰** 절약) |
| **/cost** | 지금까지 쓴 비용 확인 |
| **/help** | 도움말 보기 |

> 🎉 **축하해!** 이제 AI 코딩 환경이 완성됐어. 다음 챕터부터는 실제로 앱을 만들어볼 거야!`,
    quiz: {
      question: 'Claude Code에서 /clear 명령어를 사용하는 주된 이유는?',
      options: [
        '설치된 파일을 모두 삭제하기 위해',
        '대화 내용을 초기화해서 토큰(비용)을 절약하기 위해',
        '화면을 검은색으로 바꾸기 위해',
        'API 키를 재설정하기 위해',
      ],
      answer: 1,
      explanation: '정답! /clear는 Claude Code의 현재 대화를 초기화해요. AI가 긴 대화를 기억할수록 토큰을 많이 써서 비용이 올라가는데, /clear로 대화를 리셋하면 토큰을 절약할 수 있어요!',
    },
  },
]
