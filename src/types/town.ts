import type { JobId } from './job'

export type DistrictId = 'market' | 'downtown' | 'work' | 'countryside' | 'riverside'
export interface TownPoint { x: number; y: number }
export interface TownDistrict { id: DistrictId; name: string; color: string; roof: string; label: TownPoint }
export interface TownLocation { id: string; jobId: JobId; districtId: DistrictId; name: string; description: string; position: TownPoint }
export interface TownLaunch { jobId: JobId; mode: 'daily' | 'free-play' }
