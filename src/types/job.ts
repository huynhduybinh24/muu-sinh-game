export type JobId = 'sugarcane' | 'construction' | 'shipper' | 'noodle' | 'barber' | 'carwash' | 'rubber' | 'mechanic' | 'coffee' | 'fishing'
  | 'banhmi' | 'gas' | 'cargo' | 'cleaning' | 'electrician' | 'florist' | 'security' | 'photographer' | 'cashier' | 'harvest'

  | 'it' | 'accountant' | 'police' | 'doctor' | 'teacher' | 'taxi'

export type JobDifficulty = 'Dễ thở' | 'Hơi cực' | 'Căng à nha'

export interface Job {
  id: JobId
  name: string
  description: string
  difficulty: JobDifficulty
  duration: number
  sceneKey: string
  icon: string
}
