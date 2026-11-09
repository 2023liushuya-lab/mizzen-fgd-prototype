#!/bin/zsh
cd "${0:A:h}"
if ! command -v pnpm >/dev/null 2>&1; then
  export PATH="$HOME/.local/bin:$PATH"
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "未找到 pnpm，请联系维护人员安装 Node.js 与 pnpm。"
  read -k 1
  exit 1
fi
if curl -fsS http://127.0.0.1:3106/api/prototype-health >/dev/null 2>&1; then
  open http://localhost:3106
  exit 0
fi
if [ ! -d node_modules ]; then
  pnpm install || exit 1
fi
( sleep 3; open http://localhost:3106 ) &
pnpm dev
