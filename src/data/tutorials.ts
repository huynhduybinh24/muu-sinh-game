import type { JobId } from '../types/job'

export interface JobTutorial {
  title: string
  objective: string
  steps: readonly string[]
}

export const tutorials: Record<JobId, JobTutorial> = {
  sugarcane: {
    title: 'BÁN NƯỚC MÍA',
    objective: 'Làm đúng món trước khi khách hết kiên nhẫn!',
    steps: [
      'Xem món khách gọi',
      'Thêm đá / tắc',
      'Ép mía',
      'Giao đúng món',
    ],
  },
  construction: {
    title: 'PHỤ HỒ',
    objective: 'Xếp gạch càng chuẩn càng tốt!',
    steps: [
      'Canh viên gạch',
      'Chạm để thả',
      'Xếp càng chuẩn càng nhiều điểm',
      'PERFECT liên tục tạo combo',
    ],
  },
  shipper: {
    title: 'SHIPPER',
    objective: 'Lấy hàng rồi giao thật nhanh!',
    steps: [
      'Di chuyển đến điểm lấy hàng',
      'Lấy hàng trước',
      'Giao đến khách',
      'Né chướng ngại vật',
    ],
  },
}
