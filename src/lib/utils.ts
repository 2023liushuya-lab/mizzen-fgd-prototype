import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`;
}
export function formatTime(milliseconds: number) {
  const s = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
export function backgroundOf(p: { age: string; skin: string; notes: string }) {
  return [p.age, p.skin, p.notes].filter(Boolean).join(' · ') || '背景未填写';
}
export function sessionLink(
  role: 'host' | 'participant' | 'observer',
  session: { id: string; projectId: string; observerToken: string; delivery: string },
) {
  const query = new URLSearchParams({ project: session.projectId, session: session.id });
  if (role === 'observer') query.set('token', session.observerToken);
  return `/${role}?${query}`;
}
export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob(['\uFEFF' + text], { type: 'text/markdown;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
