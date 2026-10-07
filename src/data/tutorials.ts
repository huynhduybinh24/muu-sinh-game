import type { JobId } from '../types/job'

export interface JobTutorial {
  title: string
  objective: string
  steps: readonly string[]
}

export const tutorials: Record<JobId, JobTutorial> = {
  noodle: {
    title: 'BÁN HỦ TIẾU', objective: 'Nấu đúng tô trước khi khách hết kiên nhẫn!',
    steps: ['Xem nguyên liệu khách gọi', 'Chạm để thêm hủ tiếu / nước / thịt / rau', 'LÀM LẠI nếu thêm sai', 'GIAO KHÁCH thật nhanh để nhận thưởng'],
  },
  barber: {
    title: 'CẮT TÓC', objective: 'Cắt theo mẫu, giữ lại các ô tóc màu nâu!',
    steps: ['Nhìn mẫu tóc nhỏ ở trên', 'Ô nâu: giữ tóc; ô nhạt: cắt bỏ', 'Chạm từng mảng tóc để cắt, không cần vẽ', 'Chạm XONG trước khi khách hết kiên nhẫn'],
  },
  carwash: {
    title: 'RỬA XE', objective: 'Chà xe sạch ít nhất 90% để giao khách!',
    steps: ['Giữ và kéo ngón tay / chuột trên vết bẩn', 'Chà từng vùng cho đến khi vết bẩn mờ đi', 'Đạt 90% sẽ tự giao xe', 'Làm nhanh để nhận thêm thưởng'],
  },
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
