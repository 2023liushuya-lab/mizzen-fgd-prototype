import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createSeedData } from '@/data/seed';
import {
  participantMaterials,
  participantMaterialText,
  restoreParticipantValue,
} from '@/lib/participant-materials';
import { ConceptArtwork } from '@/features/questions/ConceptCanvas';

describe('blind participant materials', () => {
  it('uses sample aliases without mutating moderator data or question identity', () => {
    const s = createSeedData().sessions[0];
    s.testMode = 'blind';
    s.blindLabels = ['品牌甲', '产品乙'];
    s.questions[0].title = '品牌甲的产品乙有什么特点？';
    const view = participantMaterials(s);
    expect(view.questions[0].title).toBe('样品 A的样品 B有什么特点？');
    expect(view.questions[0].id).toBe(s.questions[0].id);
    expect(s.questions[0].title).toBe('品牌甲的产品乙有什么特点？');
  });
  it('retains ordinary materials unchanged', () => {
    const s = createSeedData().sessions[0];
    s.testMode = 'regular';
    expect(participantMaterials(s)).toBe(s);
  });
  it('restores coded structured values and leaves numeric answers intact', () => {
    const s = createSeedData().sessions[0];
    s.testMode = 'blind';
    s.blindLabels = ['品牌甲', '产品乙'];
    expect(restoreParticipantValue(s, ['样品 B', '样品 A'])).toEqual(['产品乙', '品牌甲']);
    expect(restoreParticipantValue(s, 0)).toBe(0);
  });
  it('handles overlapping configured names before shorter names', () => {
    const s = createSeedData().sessions[0];
    s.testMode = 'blind';
    s.blindLabels = ['产品', '产品乙'];
    expect(participantMaterialText(s, '产品乙')).toBe('样品 B');
  });
  it('omits identifying text from the built-in blind concept artwork', () => {
    const blind = renderToStaticMarkup(createElement(ConceptArtwork, { blind: true }));
    expect(blind).toContain('样品 A');
    expect(blind).not.toContain('冰绽凝霜');
    expect(blind).not.toContain('HYDRA');
    expect(blind).not.toContain('DAILY CREAM');
    expect(renderToStaticMarkup(createElement(ConceptArtwork))).toContain('冰绽凝霜');
  });
});
