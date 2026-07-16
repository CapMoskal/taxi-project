import { OrderScreen } from '@/screens/order/OrderScreen'
import { ProfileScreen } from '@/screens/profile/ProfileScreen'
import { OrderFlowProvider } from '@/features/order-flow/context'
import { NavigationProvider } from './NavigationProvider'
import { useNavigation } from './navigationContext'

function AppScreens() {
  const { screen } = useNavigation()
  return screen === 'profile' ? <ProfileScreen /> : <OrderScreen />
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
