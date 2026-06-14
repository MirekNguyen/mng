import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { authClient } from '#/lib/auth-client'
import { api } from '#/lib/api'

type ProfileMenuProps = {
  name: string
  image: string | undefined
  athleteStravaId?: number
  maxHr?: number | null
}

export const ProfileMenu = ({ name, image, athleteStravaId, maxHr: initialMaxHr }: ProfileMenuProps) => {
  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2)

  const [maxHrValue, setMaxHrValue] = useState(initialMaxHr ? String(initialMaxHr) : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = '/login'
  }

  const handleSaveMaxHr = async () => {
    if (!athleteStravaId) return
    const parsed = maxHrValue.trim() ? Number(maxHrValue) : null
    if (parsed !== null && (parsed < 100 || parsed > 250)) return
    setSaving(true)
    await api.updateAthlete(athleteStravaId, { maxHr: parsed })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full">
          <Avatar className="w-7 h-7">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="font-medium">
            {name}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {athleteStravaId && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 space-y-1.5">
              <p className="text-xs text-muted-foreground px-1">Max Heart Rate</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={100}
                  max={250}
                  placeholder="e.g. 206"
                  value={maxHrValue}
                  onChange={(e) => { setMaxHrValue(e.target.value); setSaved(false) }}
                  className="h-7 text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMaxHr() }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 text-xs shrink-0"
                  onClick={handleSaveMaxHr}
                  disabled={saving}
                >
                  {saved ? 'Saved' : saving ? '…' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground px-1">Used for HR zone analysis</p>
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
