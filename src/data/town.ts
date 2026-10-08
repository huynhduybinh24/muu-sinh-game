import type { TownDistrict, TownLocation, TownPoint } from '../types/town'

export const TOWN_SIZE = { width: 720, height: 1220 } as const
export const TOWN_WALK_MS = 560
export const TOWN_START: TownPoint = { x: 360, y: 356 }
export const townDistricts: readonly TownDistrict[] = [
  { id: 'market', name: 'CHỢ SỚM', color: '#f7e4b5', roof: '#d88b6a', label: { x: 360, y: 119 } },
  { id: 'downtown', name: 'PHỐ TRUNG TÂM', color: '#d4e6e0', roof: '#779e9e', label: { x: 360, y: 373 } },
  { id: 'work', name: 'XÓM THỢ', color: '#e3dfc9', roof: '#9a93a6', label: { x: 360, y: 633 } },
  { id: 'countryside', name: 'VƯỜN CAO SU', color: '#d7e6b4', roof: '#83a16d', label: { x: 186, y: 898 } },
  { id: 'riverside', name: 'BẾN SÔNG', color: '#c9e5db', roof: '#7ba2b2', label: { x: 543, y: 898 } },
]
export const townLocations: readonly TownLocation[] = [
  { id: 'cane-cart', jobId: 'sugarcane', districtId: 'market', name: 'Xe mía đầu chợ', description: 'Tiếng máy ép rộn ràng bên hàng cây; ly mía mát lành đợi khách.', position: { x: 125, y: 245 } },
  { id: 'noodle-stall', jobId: 'noodle', districtId: 'market', name: 'Quán hủ tiếu cô Tư', description: 'Tô hủ tiếu nóng hổi, ghế nhỏ bên đường và những vị khách quen.', position: { x: 355, y: 245 } },
  { id: 'coffee-corner', jobId: 'coffee', districtId: 'market', name: 'Góc phin sáng', description: 'Mùi cà phê theo gió chợ; canh phin thật chuẩn cho ngày mới.', position: { x: 585, y: 245 } },
  { id: 'delivery-office', jobId: 'shipper', districtId: 'downtown', name: 'Trạm giao hàng', description: 'Xe máy xếp ngay ngắn, từng đơn hàng sẵn sàng lên phố.', position: { x: 215, y: 505 } },
  { id: 'barber-shop', jobId: 'barber', districtId: 'downtown', name: 'Tiệm tóc phố nhỏ', description: 'Đèn gương sáng, ghế êm và một mái tóc mới cho khách.', position: { x: 510, y: 505 } },
  { id: 'building-site', jobId: 'construction', districtId: 'work', name: 'Công trường chú Ba', description: 'Giàn giáo dựng cao; mỗi viên gạch góp thêm một mái nhà.', position: { x: 125, y: 760 } },
  { id: 'motor-garage', jobId: 'mechanic', districtId: 'work', name: 'Gara ngã ba', description: 'Lốp, xích, bình và bugi: chọn đúng dụng cụ cho từng chiếc xe.', position: { x: 355, y: 760 } },
  { id: 'wash-bay', jobId: 'carwash', districtId: 'work', name: 'Trạm rửa xe xanh', description: 'Nước trong, bọt trắng; xe sạch bóng trước khi trở lại đường phố.', position: { x: 585, y: 760 } },
  { id: 'rubber-grove', jobId: 'rubber', districtId: 'countryside', name: 'Vườn cao su', description: 'Hàng cây xanh rì, đường cạo cong và giọt mủ trắng trong sớm mai.', position: { x: 190, y: 1030 } },
  { id: 'fishing-dock', jobId: 'fishing', districtId: 'riverside', name: 'Bến câu ven sông', description: 'Gió đồng mát rượi; chờ cá cắn rồi giật cần đúng nhịp.', position: { x: 552, y: 1030 } },
]
