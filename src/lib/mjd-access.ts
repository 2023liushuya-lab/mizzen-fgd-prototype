import type { Participant, Session } from '@/types/fgd';
// Prototype-only identifiers. Production must issue and validate credentials on the server.
export function personalCode(session: Session, person: Participant) {
  let hash = 0;
  for (const char of `${session.id}:${person.id}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return String(100000 + (hash % 900000));
}
export function identifyByCode(session: Session, code: string) {
  const matches = session.participants.filter(
    (p) => !p.removed && personalCode(session, p) === code.trim(),
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export function voiceScript(name: string) {
  return `大家好，我是${name}。很高兴参与今天的讨论，我会分享自己的真实想法和使用感受。`;
}
