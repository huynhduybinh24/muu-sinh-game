export type JobId = 'sugarcane' | 'construction' | 'shipper' | 'noodle' | 'barber' | 'carwash'

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
