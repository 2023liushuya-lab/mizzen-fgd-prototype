import { createSeedData } from '@/data/seed';
import type { Command, CommandPayload } from '@/types/commands';
import { applyCommand } from './fgd-reducer';
export const JOURNAL_PREFIX = 'mizzen-fgd-react:v1:command:';
/** One key per command avoids whole-document lost updates between role windows. */
export function readCommands(storage?: Pick<Storage, 'length' | 'key' | 'getItem'>): Command[] {
  if (!storage) return [];
  const commands: Command[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(JOURNAL_PREFIX)) continue;
    try {
      const c = JSON.parse(storage.getItem(key) || 'null');
      if (c && typeof c.commandId === 'string' && Number.isFinite(c.at)) commands.push(c);
    } catch {
      /* Ignore a damaged unrelated record; never clear browser storage. */
    }
  }
  return commands.sort((a, b) => a.at - b.at || a.commandId.localeCompare(b.commandId));
}
export function loadPrototype(storage?: Pick<Storage, 'length' | 'key' | 'getItem'>) {
  return readCommands(storage).reduce(applyCommand, createSeedData());
}
export function appendCommand(payload: CommandPayload, storage: Storage): Command {
  const commands = readCommands(storage);
  const at = Math.max(Date.now(), (commands.at(-1)?.at || 0) + 1);
  const command = { ...payload, at, commandId: crypto.randomUUID() } as Command;
  try {
    storage.setItem(JOURNAL_PREFIX + command.commandId, JSON.stringify(command));
  } catch {
    throw new Error('演示存储空间不足，内容尚未保存。请缩小上传图片后重试。');
  }
  return command;
}
