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
]

export const jobsById = Object.fromEntries(
  jobs.map((job) => [job.id, job]),
) as Record<JobId, Job>
