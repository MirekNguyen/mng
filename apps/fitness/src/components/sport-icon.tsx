import { Running, Bicycling, Swimming, Walking, Hiking, Dumbbell, Meditation, Dumbbells } from "@solar-icons/react"

const icons: Record<string, typeof Running> = {
  Run: Running,
  Ride: Bicycling,
  Swim: Swimming,
  Walk: Walking,
  Hike: Hiking,
  WeightTraining: Dumbbell,
  Yoga: Meditation,
  Workout: Dumbbells,
}

const fallbackIcon = Running

export const SportIcon = ({ type, size = 22, className }: { type: string; size?: number; className?: string }) => {
  const Icon = icons[type] ?? fallbackIcon
  return <Icon size={size} weight="Bold" className={className} />
}
