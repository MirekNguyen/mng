import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as LoginImport } from './routes/login'
import { Route as DashboardImport } from './routes/dashboard'
import { Route as TransactionsImport } from './routes/transactions'
import { Route as InvestmentsImport } from './routes/investments'
import { Route as ExpensesImport } from './routes/expenses'

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
})

const LoginRoute = LoginImport.update({
  path: '/login',
  getParentRoute: () => rootRoute,
})

const DashboardRoute = DashboardImport.update({
  path: '/dashboard',
  getParentRoute: () => rootRoute,
})

const TransactionsRoute = TransactionsImport.update({
  path: '/transactions',
  getParentRoute: () => rootRoute,
})

const InvestmentsRoute = InvestmentsImport.update({
  path: '/investments',
  getParentRoute: () => rootRoute,
})

const ExpensesRoute = ExpensesImport.update({
  path: '/expenses',
  getParentRoute: () => rootRoute,
})

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  DashboardRoute,
  TransactionsRoute,
  InvestmentsRoute,
  ExpensesRoute,
])
