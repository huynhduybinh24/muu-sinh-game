import type { Job, JobId } from '../types/job'

export const jobs: readonly Job[] = [
  {
    id: 'sugarcane',
    name: 'Bán nước mía',
    description: 'Ép mía thật nhanh, thêm tắc vừa tay và làm mát cả con phố.',
    difficulty: 'Dễ thở',
    duration: 45,
    sceneKey: 'SugarcaneScene',
    icon: '🥤',
  },
  {
    id: 'construction',
    name: 'Phụ hồ',
    description: 'Gạch lên, hồ tới! Giữ nhịp công trường và đừng để chú Ba chờ.',
    difficulty: 'Căng à nha',
    duration: 45,
    sceneKey: 'ConstructionScene',
    icon: '🧱',
  },
  {
    id: 'shipper',
    name: 'Shipper',
    description: 'Len qua phố đông, giao đúng đơn và giữ trà sữa còn nguyên nắp.',
    difficulty: 'Hơi cực',
    duration: 45,
    sceneKey: 'ShipperScene',
    icon: '🛵',
  },
  {
    id: 'noodle', name: 'Bán hủ tiếu',
    description: 'Hủ tiếu nóng hổi, đúng món đúng vị! Đừng để khách chờ nguội tô.',
    difficulty: 'Hơi cực', duration: 45, sceneKey: 'NoodleScene', icon: '🍜',
  },
  {
    id: 'barber', name: 'Cắt tóc',
    description: 'Canh mẫu tóc, kéo thật chuẩn. Khách đẹp trai là tiệm đông ngay!',
    difficulty: 'Hơi cực', duration: 45, sceneKey: 'BarberScene', icon: '💈',
  },
  {
    id: 'carwash', name: 'Rửa xe',
    description: 'Chà sạch bụi phố, trả xe sáng bóng. Càng nhanh càng nhiều khách!',
    difficulty: 'Dễ thở', duration: 45, sceneKey: 'CarwashScene', icon: '🚗',
  },
]

export const jobsById = Object.fromEntries(
  jobs.map((job) => [job.id, job]),
) as Record<JobId, Job>
