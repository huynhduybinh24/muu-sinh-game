export const MECHANIC_CONFIG = { correct: 100, wrong: -40, timeout: -25, fastBonus: 50,
  patience: { min: 10, max: 14 }, repairMs: 360, nextVehicleMs: 550 } as const
export const mechanicTools = [
  { id: 'pump', label: 'BƠM LỐP' }, { id: 'cable', label: 'KÍCH BÌNH' },
  { id: 'wrench', label: 'SIẾT XÍCH' }, { id: 'plug', label: 'VỆ SINH BUGI' },
] as const
export type MechanicTool = typeof mechanicTools[number]['id']
export const mechanicProblems = [
  { id: 'flat', name: 'LỐP XẸP', symptom: 'Lốp mềm, xe lắc khi chạy.', tool: 'pump' },
  { id: 'battery', name: 'HẾT BÌNH', symptom: 'Đề không lên, đèn rất yếu.', tool: 'cable' },
  { id: 'chain', name: 'XÍCH LỎNG', symptom: 'Xích kêu lạch cạch, chùng xuống.', tool: 'wrench' },
  { id: 'spark', name: 'BUGI BẨN', symptom: 'Máy giật, nổ không đều.', tool: 'plug' },
] as const satisfies readonly { id: string; name: string; symptom: string; tool: MechanicTool }[]
export type MechanicProblem = typeof mechanicProblems[number]
export function matchesRepair(problem: MechanicProblem, tool: MechanicTool): boolean { return problem.tool === tool }
