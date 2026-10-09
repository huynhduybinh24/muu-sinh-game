import type { ItemCategory, LifestyleState, RoomSlot, WearableSlot } from '../types/shop'

export const shopCategories: Record<ItemCategory, string> = {
  hair: 'TÓC', shirt: 'ÁO', pants: 'QUẦN', shoes: 'GIÀY', accessory: 'PHỤ KIỆN',
  phone: 'ĐIỆN THOẠI', electronics: 'ĐIỆN TỬ', vehicle: 'XE CỘ', tools: 'ĐỒ CÁ NHÂN', home: 'NỘI THẤT',
}
export const wearableSlots: readonly WearableSlot[] = ['shoes', 'hat', 'face', 'back', 'hand']
export const roomSlots: Record<RoomSlot, string> = { bed: 'Giường', desk: 'Bàn', seat: 'Ghế', storage: 'Tủ / kệ', lounge: 'Sofa', screen: 'TV', plant: 'Cây', light: 'Đèn', decor: 'Trang trí' }
export const emptyLifestyle = (): LifestyleState => ({
  equipment: { shoes: null, hat: null, face: null, back: null, hand: null },
  phone: null, computer: null, vehicle: null,
  room: { bed: null, desk: null, seat: null, storage: null, lounge: null, screen: null, plant: null, light: null, decor: null },
})
export const SHOP_CONFIRM_PRICE = 500_000
export function priceTier(price: number) { return price < 100_000 ? 'Khởi đầu' : price < 1_000_000 ? 'Hằng ngày' : price < 10_000_000 ? 'Cao cấp' : 'Mơ ước' }
