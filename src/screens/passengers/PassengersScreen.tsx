import { Baby, CreditCard, Headphones, Lock, ShieldCheck, Umbrella } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ScreenShell } from '@/shared/ui/ScreenShell'
import { useNavigation } from '@/app/navigationContext'
import { useIsDesktop } from '@/shared/lib/useIsDesktop'

const TOPICS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ShieldCheck,
    title: 'Безопасность в поездке',
    description: 'Проверяем водителей и автомобили перед выходом на линию, отслеживаем маршрут в реальном времени.',
  },
  {
    icon: Umbrella,
    title: 'Страхование поездок',
    description: 'Каждая поездка застрахована — от посадки до финиша, без дополнительных действий с вашей стороны.',
  },
  {
    icon: Lock,
    title: 'Конфиденциальность данных',
    description: 'Номер телефона не передаётся водителю напрямую, история поездок доступна только вам.',
  },
  {
    icon: CreditCard,
    title: 'Финансовая безопасность',
    description: 'Оплата проходит через защищённое соединение, чек приходит сразу после завершения поездки.',
  },
  {
    icon: Baby,
    title: 'Безопасность детей',
    description: 'Указывайте в комментарии к заказу, если едете с ребёнком — водитель будет предупреждён заранее.',
  },
  {
    icon: Headphones,
    title: 'Поддержка 24/7',
    description: 'Служба поддержки на связи круглосуточно — по любому вопросу до, во время и после поездки.',
  },
]

// One flat page — intro + a grid of topic cards (Eugene confirmed: cards are
// a visual grouping, not a second navigation level). Styled after the Yandex
// Go reference (docs/decisions.md, 2026-07-28) but with our own taxi-app
// copy, not a clone of theirs (COVID/scooters etc. dropped as irrelevant).
function PassengersScreen() {
  const { navigate } = useNavigation()
  const isDesktop = useIsDesktop()

  // Flat navigation (no history stack) — desktop arrived via the navbar tab
  // (peer of the order screen), mobile arrived via Профиль's quick links.
  const handleBack = () => navigate(isDesktop ? 'order' : 'profile')

  return (
    <ScreenShell title="Пассажирам" onBack={handleBack}>
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Мы делаем поездки на такси комфортнее и безопаснее — постоянно улучшаем стандарты качества и
          технологии, которые помогают заботиться о пассажирах на каждом этапе поездки.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TOPICS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}

export { PassengersScreen }
