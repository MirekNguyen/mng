import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSessionResult } from '#/lib/session.server'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'

const checkSession = createServerFn({ method: 'GET' }).handler(async () => {
  const result = await getSessionResult()
  if (!result.authenticated) return { status: 'unauthenticated' as const }
  if (result.stravaConnected) return { status: 'connected' as const }
  return { status: 'needs_strava' as const, userName: result.userName }
})

export const Route = createFileRoute('/connect-strava')({
  beforeLoad: async () => {
    const result = await checkSession()
    if (result.status === 'unauthenticated') throw redirect({ to: '/login' })
    if (result.status === 'connected') throw redirect({ to: '/dashboard' })
    return result
  },
  loader: ({ context }) => context,
  component: ConnectStravaPage,
})

function ConnectStravaPage() {
  const { userName } = Route.useLoaderData()

  const handleConnect = () => {
    authClient.linkSocial({
      provider: "strava",
      callbackURL: "/dashboard",
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
          </div>
          Fitness
        </a>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Connect Strava</CardTitle>
            <CardDescription>
              Hi {userName}! Link your Strava account to sync activities and unlock AI coaching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button
                className="w-full bg-[#fc4c02] hover:bg-[#e04400] text-white"
                onClick={handleConnect}
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                Connect Strava
              </Button>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              We only read your activities. We never post or modify anything on Strava.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
