import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/lib/session.server'

const getSessionFn = createServerFn({ method: 'GET' }).handler(() => {
  return getSession()
})

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})
