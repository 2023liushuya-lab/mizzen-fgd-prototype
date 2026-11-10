import type { Question, QuestionType } from '@/types/fgd';

// Only question content configuration belongs here; FGD has no automatic follow-up levels.
export function questionTypePatch(type: QuestionType): Partial<Question> {
  const patch: Partial<Question> = {
    type,
    options: undefined,
    items: undefined,
    matrixRows: undefined,
    scale: undefined,
  };
  if (['单选题', '多选题', '矩阵题', '级联选择题'].includes(type))
    patch.options = ['选项一', '选项二', '选项三'];
  if (type === '矩阵题') patch.matrixRows = ['产品一', '产品二'];
  if (type === '量表题')
    patch.scale = { min: 1, max: 5, minLabel: '非常不喜欢', maxLabel: '非常喜欢' };
  if (['排序题', '比重题'].includes(type)) patch.items = ['项目一', '项目二', '项目三'];
  return patch;
}
