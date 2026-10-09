export const IT_CONFIG = { correct: 100, bonus: 50, wrong: -30, timeout: -20, patience: 15, minimumPatience: 10, nextMs: 650 } as const
export const logicalSteps = ['ĐỌC', 'KIỂM TRA', 'HIỂN THỊ'] as const
export interface BugTicket { title: string; blocks: readonly string[]; broken: number; fixes: readonly string[]; fix: number }
export const bugTickets: readonly BugTicket[] = [
  { title: 'Mưa thì mang ô!', blocks: ['ĐỌC thời tiết', 'NẾU mưa: cất ô', 'HIỂN THỊ nhắc nhở'], broken: 1, fixes: ['Mang ô khi mưa', 'Cất ô khi mưa', 'Luôn bỏ qua mưa'], fix: 0 },
  { title: 'Đèn xanh mới đi', blocks: ['ĐỌC màu đèn', 'NẾU đỏ: đi tiếp', 'HIỂN THỊ hướng dẫn'], broken: 1, fixes: ['Đi khi đỏ', 'Đi khi xanh', 'Không đọc màu đèn'], fix: 1 },
  { title: 'Giỏ có 2 + 1 quả', blocks: ['ĐỌC 2 quả + 1 quả', 'TỔNG = 2', 'HIỂN THỊ tổng'], broken: 1, fixes: ['Tổng bằng 2', 'Tổng bằng 4', 'Tổng bằng 3'], fix: 2 },
  { title: 'Tên khách không để trống', blocks: ['BỎ QUA tên khách', 'KIỂM TRA tên có chữ', 'HIỂN THỊ lời chào'], broken: 0, fixes: ['Đọc tên khách', 'Xóa tên khách', 'Bỏ kiểm tra tên'], fix: 0 },
]
export const itPatience = (fixed: number) => Math.max(IT_CONFIG.minimumPatience, IT_CONFIG.patience - fixed * .4)
export const isLogicalStep = (selected: number, completed: number) => selected === completed && completed < logicalSteps.length
export function debugPoints(remaining: number, total: number) { return IT_CONFIG.correct + Math.round(Math.max(0, Math.min(1, remaining / Math.max(1, total))) * IT_CONFIG.bonus) }
