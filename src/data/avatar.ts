import type { PlayerAppearance } from '../types/profile'

interface AvatarOption<Id extends string> {
  id: Id
  label: string
  color: string
}

type AvatarOptions = {
  [Key in keyof PlayerAppearance]: readonly AvatarOption<PlayerAppearance[Key]>[]
}

// Renderer-independent IDs/colors can also be used by a future Phaser avatar.
export const avatarOptions: AvatarOptions = {
  gender: [
    { id: 'male', label: 'Nam', color: '#4697db' },
    { id: 'female', label: 'Nữ', color: '#df779f' },
  ],
  skinToneId: [
    { id: 'peach', label: 'Hồng đào', color: '#ffdbc4' },
    { id: 'warm', label: 'Ấm áp', color: '#eebe93' },
    { id: 'tan', label: 'Nắng mật ong', color: '#ca8f65' },
    { id: 'deep', label: 'Nâu trầm', color: '#925d43' },
  ],
  hairId: [
    { id: 'crop', label: 'Tóc gọn', color: '#382e34' },
    { id: 'swoop', label: 'Mái bay', color: '#49312c' },
    { id: 'bob', label: 'Tóc bob', color: '#382e34' },
    { id: 'bun', label: 'Búi cao', color: '#49312c' },
    { id: 'curls', label: 'Xoăn vui', color: '#382e34' },
    { id: 'long', label: 'Tóc dài', color: '#49312c' },
  ],
  shirtId: [
    { id: 'coral', label: 'Cam san hô', color: '#f47564' },
    { id: 'mint', label: 'Xanh bạc hà', color: '#62bb9c' },
    { id: 'blue', label: 'Xanh trời', color: '#69a5e4' },
    { id: 'sunshine', label: 'Vàng nắng', color: '#f3c44f' },
    { id: 'lavender', label: 'Tím mơ', color: '#a58bd4' },
    { id: 'cream', label: 'Kem sữa', color: '#f4e6cb' },
    { id: 'cherry', label: 'Đỏ anh đào', color: '#c74456' },
    { id: 'charcoal', label: 'Đen cá tính', color: '#404455' },
    { id: 'ocean', label: 'Xanh đại dương', color: '#278b9f' },
    { id: 'rose', label: 'Hồng ánh mai', color: '#e6a1b7' },
  ],
  pantsId: [
    { id: 'denim', label: 'Jeans xanh', color: '#587baf' },
    { id: 'navy', label: 'Xanh đậm', color: '#3c4769' },
    { id: 'sand', label: 'Màu cát', color: '#bc9b73' },
    { id: 'forest', label: 'Xanh rừng', color: '#557967' },
    { id: 'charcoal', label: 'Xám thanh lịch', color: '#565769' },
    { id: 'plum', label: 'Tím mận', color: '#775a83' },
  ],
}

export const appearanceLabels: Record<keyof PlayerAppearance, string> = {
  gender: 'Giới tính', skinToneId: 'Màu da', hairId: 'Kiểu tóc',
  shirtId: 'Áo', pantsId: 'Quần',
}

export const defaultAppearance: Readonly<PlayerAppearance> = {
  gender: 'male', skinToneId: 'warm', hairId: 'swoop', shirtId: 'coral', pantsId: 'denim',
}

export const appearanceKeys = Object.keys(appearanceLabels) as (keyof PlayerAppearance)[]

export function getAvatarOption<Key extends keyof PlayerAppearance>(
  key: Key, id: PlayerAppearance[Key],
) {
  return avatarOptions[key].find((option) => option.id === id) ?? avatarOptions[key][0]
}
