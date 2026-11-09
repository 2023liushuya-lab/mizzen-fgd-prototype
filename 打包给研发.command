#!/bin/zsh
cd "${0:A:h}"
export PATH="$HOME/.local/bin:$PATH"
node scripts/package-handoff.mjs
if [ $? -eq 0 ]; then
  open ../fgd-workbench-deliveries
else
  echo "打包失败，请把上方错误发给 Codex。"
fi
read -k 1 "?按任意键关闭…"
