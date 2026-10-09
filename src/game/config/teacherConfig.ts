export const TEACHER_CONFIG = { correct: 100, bonus: 50, wrong: -30, timeout: -20, attentionDrain: 2.5, attentionBoost: 15, attentionPenalty: 10, patience: 15, minimumPatience: 10, nextMs: 700 } as const
export const lessonSteps = ['ĐỌC ĐỀ', 'THẢO LUẬN', 'TRẢ LỜI'] as const
export const schoolTools = ['BÚT', 'SÁCH', 'THƯỚC'] as const
export interface LessonQuestion { question: string; answers: readonly string[]; correct: number }
export const lessonQuestions: readonly LessonQuestion[] = [
  { question: '2 + 3 = ?', answers: ['4', '5', '6'], correct: 1 },
  { question: 'Hình nào có 3 cạnh?', answers: ['Tròn', 'Vuông', 'Tam giác'], correct: 2 },
  { question: 'Từ nào chỉ con vật?', answers: ['Mèo', 'Bàn', 'Bút'], correct: 0 },
  { question: '5 − 2 = ?', answers: ['2', '3', '4'], correct: 1 },
]
export const lessonPoints = (attention: number) => TEACHER_CONFIG.correct + Math.round(Math.max(0, Math.min(TEACHER_CONFIG.bonus, attention)))
export const teacherPatience = (lessons: number) => Math.max(TEACHER_CONFIG.minimumPatience, TEACHER_CONFIG.patience - lessons * .35)
