import { HugeiconsIcon } from '@hugeicons/react'
import {
  RunningShoesIcon,
  BikeIcon,
  SwimmingIcon,
  WalkingIcon,
  MountainIcon,
  DumbbellIcon,
  ActivityIcon,
} from '@hugeicons/core-free-icons'

type IconType = typeof RunningShoesIcon

const icons: Record<string, IconType> = {
  Run: RunningShoesIcon,
  Ride: BikeIcon,
  Swim: SwimmingIcon,
  Walk: WalkingIcon,
  Hike: MountainIcon,
  WeightTraining: DumbbellIcon,
  Yoga: ActivityIcon,
  Workout: DumbbellIcon,
}

const fallbackIcon = RunningShoesIcon

export const SportIcon = ({ type, size = 22, className }: { type: string; size?: number; className?: string }) => {
  const icon = icons[type] ?? fallbackIcon
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} className={className} />
}
