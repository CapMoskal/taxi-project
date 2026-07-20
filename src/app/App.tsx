import { OrderScreen } from '@/screens/order/OrderScreen'
import { ProfileScreen } from '@/screens/profile/ProfileScreen'
import { RideHistoryScreen } from '@/screens/history/RideHistoryScreen'
import { OrderFlowProvider } from '@/features/order-flow/context'
import { NavigationProvider } from './NavigationProvider'
import { useNavigation } from './navigationContext'

function AppScreens() {
  const { screen } = useNavigation()
  if (screen === 'profile') return <ProfileScreen />
  if (screen === 'history') return <RideHistoryScreen />
  return <OrderScreen />
}

function App() {
  return (
    <NavigationProvider>
      <OrderFlowProvider>
        <AppScreens />
      </OrderFlowProvider>
    </NavigationProvider>
  )
}

export default App
