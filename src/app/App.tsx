import { OrderScreen } from '@/screens/order/OrderScreen'
import { ProfileScreen } from '@/screens/profile/ProfileScreen'
import { RideHistoryScreen } from '@/screens/history/RideHistoryScreen'
import { OrderFlowProvider } from '@/features/order-flow/context'
import { OfflineBanner } from '@/shared/ui/OfflineBanner'
import { NavigationProvider } from './NavigationProvider'
import { ThemeProvider } from './ThemeProvider'
import { useNavigation } from './navigationContext'

function AppScreens() {
  const { screen } = useNavigation()
  if (screen === 'profile') return <ProfileScreen />
  if (screen === 'history') return <RideHistoryScreen />
  return <OrderScreen />
}

function App() {
  return (
    <ThemeProvider>
      <NavigationProvider>
        <OrderFlowProvider>
          <OfflineBanner />
          <AppScreens />
        </OrderFlowProvider>
      </NavigationProvider>
    </ThemeProvider>
  )
}

export default App
