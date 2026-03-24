# agents-hive — Claude Code Install Guide

이 파일은 Claude Code가 읽고 agents-hive를 자동으로 설치·설정할 수 있도록 작성되었습니다.

## 1. Prerequisites Check

아래 명령어로 필수 도구가 설치되어 있는지 확인하세요:

```bash
command -v git && command -v bun && command -v tmux
```

bun이 없으면 먼저 설치:

```bash
curl -fsSL https://bun.sh/install | bash
```

tmux가 없으면 설치 (`hive start` / `hive session all`에 필요):

```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux
```

## 2. Install agents-hive

```bash
git clone https://github.com/bokgun/agents-hive.git ~/.agents-hive
cd ~/.agents-hive && bun install && bun run build && bun link
```

## 3. Initialize Workspace

```bash
hive init ~/agents-workspace
```

셸 설정에 환경변수를 추가하세요:

```bash
echo 'export HIVE_WORKSPACE=~/agents-workspace' >> ~/.zshrc
export HIVE_WORKSPACE=~/agents-workspace
```

## 4. Create Your First Project

현재 작업 디렉토리를 프로젝트로 등록:

```bash
hive project create my-project claude "프로젝트 설명"
```

에이전트 옵션: `claude` (코딩), `gemini` (리서치), `codex` (비동기 작업)

## 5. Verify

```bash
hive status
hive --version
```

## Quick Reference

| 명령어 | 설명 |
|--------|------|
| `hive project create <name> <agent> <desc>` | 프로젝트 생성 |
| `hive project list` | 프로젝트 목록 |
| `hive memo <project> <content>` | 프로젝트 메모 저장 |
| `hive memo global <content>` | 전역 메모 저장 |
| `hive status` | 전체 상태 확인 |
| `hive run <project> <command>` | 에이전트로 명령 실행 |
| `hive session <project>` | 인터랙티브 세션 |
| `hive briefing` | 일일 브리핑 생성 |
| `hive cron add <name> <schedule> <cmd>` | 크론 작업 추가 |

## For Claude Code

이 프로젝트를 설치한 후, 워크스페이스의 `CLAUDE.md`에 아래 내용을 추가하면 agents-hive와 연동됩니다:

```markdown
## agents-hive Integration
- 작업 완료 시 `.claude/memory.md`에 요약을 기록하세요
- 상태 변경 시 `shared-memory/status.json`을 업데이트하세요
- 다른 프로젝트 참조 시 `shared-memory/`를 확인하세요
```

## Telegram 플러그인 (선택)

`hive start -t` 또는 `--channels plugin:telegram`을 사용하려면 각 머신에서 Claude Code 텔레그램 플러그인을 설정하세요:

```bash
claude plugins add telegram@claude-plugins-official
claude --channels plugin:telegram@claude-plugins-official
```

플러그인 설정은 `~/.claude/channels/telegram/`에 저장되며 머신 로컬입니다 (git으로 동기화되지 않음).

소스: https://github.com/bokgun/agents-hive
