# 🐝 agents-hive

**Claude Code, Gemini CLI, Codex CLI를 위한 멀티 에이전트 워크스페이스 매니저.**

여러 AI 코딩 에이전트를 하나의 워크스페이스에서 공유 메모리, 크론 스케줄링, Telegram/Discord 연동과 함께 오케스트레이션 — API 키 없이 구독만으로 사용 가능.

```
hive init
hive project create backend claude "REST API 서버"
hive project create research gemini "시장 분석"
hive project create monitor codex "헬스 체크"
hive memo backend "Kotlin + Spring Boot, snake_case DB 사용"
hive cron add tests '*/30 * * * *' 'cd $HIVE_WORKSPACE/backend && claude -p "npm test"'
hive session backend --channels plugin:telegram@claude-plugins-official
```

<!-- TODO: 실제 스크린샷으로 교체 -->
<!-- ![demo](assets/demo.gif) -->

> [English](README.md)

---

## 왜 만들었나?

AI 코딩 에이전트는 혼자도 강력하지만, 함께하면 팀이 됩니다:

| 에이전트 | 강점 | 인증 |
|----------|------|------|
| **Claude Code** | 코딩, 아키텍처, 코드 리뷰 | claude.ai 로그인 (Pro/Max) |
| **Gemini CLI** | 리서치, 대량 분석, 긴 컨텍스트 | Google 로그인 |
| **Codex CLI** | 비동기 작업, PR 자동화, Slack | ChatGPT 로그인 (Plus/Pro) |

하지만 여러 프로젝트에서 동시에 돌리면 금방 지저분해집니다 — 흩어진 컨텍스트, 공유 메모리 없음, 수동 크론 스크립트. **agents-hive**가 제공하는 것:

- 🗂️ **하나의 워크스페이스, 여러 프로젝트** — 각각 고유한 에이전트, 메모리, 설정
- 🧠 **공유 메모리** — 세션을 넘어 유지되는 파일 기반 크로스 프로젝트 컨텍스트
- ⏰ **크론 관리** — 하나의 CLI에서 반복 작업 스케줄링 및 관리
- 📱 **채널 연동** — `--channels`로 Telegram/Discord에서 세션 제어
- 🔑 **API 키 불필요** — 구독 플랜 로그인으로 동작

## 설치

```bash
# 방법 1: 클론 후 설치
git clone https://github.com/bokgun/agents-hive.git
cd agents-hive && bun install && bun run build && bun link

# 방법 2: 빠른 설치 (bun + git 필요)
curl -fsSL https://raw.githubusercontent.com/bokgun/agents-hive/main/install.sh | bash
```

### 설치 해제

```bash
hive uninstall
```

### 사전 요구사항

- **Node.js** 18+, [**bun**](https://bun.sh), **git**, **tmux**
- 에이전트 CLI 최소 하나:
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview) — `npm i -g @anthropic-ai/claude-code`
  - [Codex CLI](https://github.com/openai/codex) — `npm i -g @openai/codex`
  - [Gemini CLI](https://github.com/google-gemini/gemini-cli) — `npm i -g @anthropic-ai/gemini-cli`

#### tmux (`hive start` / `hive session all` 에 필요)

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux
```

#### Telegram 플러그인 (선택, `-t` 플래그 사용 시)

`hive start -t` 또는 `--channels plugin:telegram`을 사용하려면 Claude Code 텔레그램 플러그인을 **각 머신마다** 설정해야 합니다:

```bash
# 1. 플러그인 활성화
claude plugins add telegram@claude-plugins-official

# 2. 봇 토큰 및 접근 설정 (대화형)
claude --channels plugin:telegram@claude-plugins-official
# 텔레그램에서 페어링 안내를 따르세요
```

> **참고:** 텔레그램 플러그인 설정은 `~/.claude/channels/telegram/`에 저장되며 머신 로컬입니다 — git으로 동기화되지 않으므로 각 컴퓨터에서 별도로 설정해야 합니다.

## 빠른 시작

```bash
# 1. 워크스페이스 초기화
hive init ~/my-workspace
export HIVE_WORKSPACE=~/my-workspace

# 2. 프로젝트 생성
hive project create api claude "백엔드 API"
hive project create blog gemini "블로그 자동화"

# 3. 메모 추가
hive memo api "PostgreSQL, 6개 테이블, snake_case 컨벤션"
hive memo global "스프린트 목표: 금요일까지 MVP"

# 4. 크론 작업 스케줄링
hive cron add api-test '*/30 * * * *' 'cd $HIVE_WORKSPACE/api && claude -p "테스트 실행"'
hive cron add blog-research '0 9 * * *' 'cd $HIVE_WORKSPACE/blog && gemini -p "트렌딩 키워드"'
hive cron apply

# 5. Telegram과 함께 세션 시작
hive session api --channels plugin:telegram@claude-plugins-official
```

## 명령어

### 워크스페이스

| 명령어 | 설명 |
|--------|------|
| `hive init [경로]` | 새 워크스페이스 초기화 |
| `hive status` | 모든 프로젝트 상태 표시 |
| `hive briefing` | 모든 프로젝트의 일일 브리핑 생성 |
| `hive cleanup` | 50줄 초과 메모리 항목 아카이브 |

### 프로젝트

```bash
hive project create <이름> <claude|gemini|codex> <설명>
hive project edit   <이름> <description|agent> <값>
hive project delete <이름>
hive project list
```

### 메모리

```bash
hive memo <프로젝트> <내용>     # 프로젝트 메모 저장
hive memo global <내용>        # 전역 메모 저장
hive memo <프로젝트>            # 프로젝트 메모 보기
hive memo global               # 전역 메모 보기
```

메모리는 마크다운 파일로 저장됩니다:
- **프로젝트 메모리**: `<프로젝트>/.claude/memory.md` — Claude Code가 자동 로드
- **전역 메모**: `shared-memory/memo.md` — 크로스 프로젝트 노트
- **결정 로그**: `shared-memory/decisions.md` — 아키텍처 결정 사항
- **상태**: `shared-memory/status.json` — 머신 리더블 프로젝트 상태

### 크론

```bash
hive cron add <이름> <'스케줄'> <명령어>
hive cron list
hive cron remove <이름>
hive cron show                    # 생성된 crontab 표시
hive cron apply                   # 시스템 crontab에 설치
```

### 실행

```bash
hive run <프로젝트> <명령어>      # 할당된 에이전트로 명령 실행
hive session <프로젝트> [플래그]   # 인터랙티브 Claude Code 세션
hive session all                  # 모든 프로젝트를 tmux 분할로 시작
hive notify <메시지>              # Telegram 알림 전송
```

### 세션 (백그라운드)

```bash
hive start [프로젝트] [-t] [-d]   # 백그라운드 tmux 세션으로 시작
hive stop [프로젝트]               # 실행 중인 세션 종료
hive ps                           # 실행 중인 세션 목록
```

옵션: `-t, --telegram` 텔레그램 채널 연동, `-d, --discord` 디스코드 채널 연동.
프로젝트 없이 실행하면 워크스페이스 루트에서 시작.

### 설정 & 관리

```bash
hive setup telegram               # 대화형 텔레그램 설정
hive update                       # 최신 버전으로 업데이트
hive uninstall                    # agents-hive CLI 삭제
```

## 아키텍처

```
~/my-workspace/
├── CLAUDE.md                  # 워크스페이스 레벨 컨텍스트 (자동 로드)
├── shared-memory/
│   ├── status.json            # 프로젝트 상태 (hive & 에이전트가 업데이트)
│   ├── memo.md                # 전역 메모
│   ├── decisions.md           # 결정 로그
│   ├── daily-briefing.md      # 자동 생성 브리핑
│   └── archive/               # 주간 메모리 아카이브
├── api/                       # 프로젝트: Claude Code
│   ├── CLAUDE.md              # 프로젝트 규칙 (자동 로드)
│   ├── .claude/
│   │   ├── memory.md          # 영구 메모리
│   │   └── settings.json      # 권한 설정
│   └── src/
├── blog/                      # 프로젝트: Gemini CLI
│   ├── CLAUDE.md
│   ├── GEMINI.md              # Gemini 전용 설정
│   ├── .claude/memory.md
│   └── output/
├── monitor/                   # 프로젝트: Codex CLI
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   ├── .codex/config.toml     # Codex 모델 설정
│   ├── .claude/memory.md
│   └── logs/
├── .claude/
│   └── settings.json          # 사전 승인된 권한
└── .hive/
    └── crontab.generated      # 관리되는 크론 작업
```

### 메모리 작동 방식

핵심 인사이트: **Claude Code는 작업 디렉토리에서 `CLAUDE.md`와 `.claude/memory.md`를 자동 로드합니다.** `hive run api "테스트 수정"`을 실행하면 먼저 프로젝트 디렉토리로 `cd`합니다 — Claude Code가 헤드리스 모드에서도 프로젝트 컨텍스트를 자동으로 인식합니다.

크로스 프로젝트 메모리는 `shared-memory/`에 있으며, 에이전트들은 (CLAUDE.md 규칙을 통해) 이를 읽고 쓰도록 지시받습니다. 이것이 에이전트들이 같은 세션에 있지 않아도 되는 경량 조율 레이어를 만듭니다.

### 하이브리드 전략

```
┌─ 영구 세션 (메인 프로젝트) ──────────┐
│ hive session api --channels telegram │
│ + /loop으로 실시간 모니터링           │
│ + Swarms로 복잡한 설계 작업          │
└──────────────────────────────────────┘

┌─ 시스템 크론 (백그라운드 프로젝트) ──┐
│ hive cron: blog → gemini (무료 할당) │
│ hive cron: monitor → codex (경량)    │
│ 실패 시 → hive notify               │
└──────────────────────────────────────┘

┌─ 임시 명령어 ────────────────────────┐
│ hive run api "PR #42 리뷰"           │
│ hive run blog "오늘 트렌드 분석"      │
└──────────────────────────────────────┘
```

## 설정

### Telegram 알림 (선택사항)

```bash
cp ~/my-workspace/.env.example ~/my-workspace/.env
# .env에 봇 토큰과 채팅 ID 입력
```

### 에이전트 인증

agents-hive는 **구독 플랜 로그인**을 사용합니다 — API 키 불필요:

- **Claude Code**: `claude` → claude.ai 계정으로 로그인
- **Codex CLI**: `codex` → ChatGPT 계정으로 로그인
- **Gemini CLI**: `gemini` → Google 계정으로 로그인

### 셸 연동

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export HIVE_WORKSPACE=~/my-workspace

# 또는: 현재 디렉토리에서 자동 감지
# hive는 cwd에서 shared-memory/status.json을 찾습니다
```

## OpenClaw과 비교

| 기능 | agents-hive | OpenClaw |
|------|-------------|----------|
| 메시징 채널 | Telegram, Discord (`--channels`) | 20+ 플랫폼 |
| 항상 켜짐 데몬 | tmux/백그라운드 터미널 | 네이티브 게이트웨이 데몬 |
| 코딩 품질 | 네이티브 Claude Code / Codex | 백엔드 LLM에 의존 |
| 모델 자유도 | Claude + Gemini + Codex | 모든 모델 + Ollama |
| 비용 | 구독 ($20-200/월) | 오픈소스 + API 비용 |
| 설정 | 명령어 하나 | 셀프 호스팅 게이트웨이 |
| 멀티 프로젝트 | 내장 | 단일 게이트웨이 라우팅 |

**agents-hive**는 코딩 품질이 가장 중요하고 경량 파일 기반 조율 레이어를 원할 때 최적입니다. **OpenClaw**는 넓은 플랫폼 커버리지가 필요한 항상 켜져 있는 개인 어시스턴트에 더 적합합니다.

## Claude Code 연동

다른 Claude Code 세션에서 agents-hive를 설치하려면 [`CLAUDE-INSTALL.ko.md`](CLAUDE-INSTALL.ko.md)를 읽게 하세요:

```
이 파일을 읽고 따라해: https://raw.githubusercontent.com/bokgun/agents-hive/main/CLAUDE-INSTALL.ko.md
```

또는 한 줄로 설치:

```bash
git clone https://github.com/bokgun/agents-hive.git ~/.agents-hive && cd ~/.agents-hive && bun install && bun run build && bun link
```

> [English Install Guide](CLAUDE-INSTALL.md)

## 기여

가이드라인은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

## 라이선스

[MIT](LICENSE)
