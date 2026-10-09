export const DOCTOR_CONFIG = { correct: 100, bonus: 50, wrong: -40, timeout: -25, patience: 15, minimumPatience: 10, perfectRatio: .5, nextMs: 700 } as const
export const careTools = ['CHĂN', 'NƯỚC', 'ĐỒ CHƠI'] as const
export const careShapes = ['♥', '★', '●'] as const
export interface CareRequest { urgency: 1 | 2 | 3; tool: number; sequence: readonly number[] }
export const careRequests: readonly CareRequest[] = [
  { urgency: 3, tool: 0, sequence: [0, 1] }, { urgency: 2, tool: 1, sequence: [2, 0] },
  { urgency: 1, tool: 2, sequence: [1, 2] }, { urgency: 3, tool: 2, sequence: [2, 1] },
]
export const priorityPatient = (requests: readonly CareRequest[]) => requests.findIndex(request => request.urgency === Math.max(...requests.map(item => item.urgency)))
export const carePoints = (remaining: number, total: number) => DOCTOR_CONFIG.correct + Math.round(Math.max(0, Math.min(1, remaining / Math.max(1, total))) * DOCTOR_CONFIG.bonus)
export const carePatience = (helped: number) => Math.max(DOCTOR_CONFIG.minimumPatience, DOCTOR_CONFIG.patience - helped * .4)
