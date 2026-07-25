import { OrderScreen } from '@/screens/order/OrderScreen'
import { ProfileScreen } from '@/screens/profile/ProfileScreen'
import { RideHistoryScreen } from '@/screens/history/RideHistoryScreen'
import { PaymentMethodsScreen } from '@/screens/profile/PaymentMethodsScreen'
import { AddressesScreen } from '@/screens/profile/AddressesScreen'
import { SettingsScreen } from '@/screens/profile/SettingsScreen'
import { InfoScreen } from '@/screens/profile/InfoScreen'
import { SupportScreen } from '@/screens/profile/SupportScreen'
import { OrderFlowProvider } from '@/features/order-flow/context'
import { OfflineBanner } from '@/shared/ui/OfflineBanner'
import { NavigationProvider } from './NavigationProvider'
import { ThemeProvider } from './ThemeProvider'
import { useNavigation } from './navigationContext'

function AppScreens() {
  const { screen } = useNavigation()
  if (screen === 'profile') return <ProfileScreen />
  if (screen === 'history') return <RideHistoryScreen />
  if (screen === 'payment-methods') return <PaymentMethodsScreen />
  if (screen === 'addresses') return <AddressesScreen />
  if (screen === 'settings') return <SettingsScreen />
  if (screen === 'info') return <InfoScreen />
  if (screen === 'support') return <SupportScreen />
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
