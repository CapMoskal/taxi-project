import { useState } from 'react'
import { CalendarClock, Car, Gift, Headphones, TrendingUp, Wallet } from 'lucide-react'
import { TopicPageScreen, type Topic } from '@/screens/_shared/TopicPageScreen'

const TOPICS: Topic[] = [
  {
    icon: Wallet,
    title: 'Выплаты каждый день',
    description: 'Выводите заработанное в любой момент — не нужно ждать фиксированной даты выплаты.',
  },
  {
    icon: CalendarClock,
    title: 'Гибкий график',
    description: 'Работайте в удобное время — совмещайте с учёбой, основной работой или другими делами.',
  },
  {
    icon: Headphones,
    title: 'Поддержка 24/7',
    description: 'Служба поддержки водителей на связи круглосуточно — по любому вопросу на линии.',
  },
  {
    icon: Car,
    title: 'Аренда авто',
    description: 'Нет своей машины — подключим партнёрское авто для работы на выгодных условиях.',
  },
  {
    icon: Gift,
    title: 'Система бонусов',
    description: 'Дополнительные выплаты за активность в часы пик и выполнение целей по поездкам.',
  },
  {
    icon: TrendingUp,
    title: 'Доход под ваши цели',
    description: 'Сами решаете, сколько работать — доход растёт вместе с количеством выполненных поездок.',
  },
]

const INTRO =
  'Станьте водителем-партнёром — гибкий график, ежедневные выплаты и поддержка на каждом этапе. ' +
  'Начать можно в удобное для вас время.'

// Same flat info-page shape as Пассажирам (Eugene chose this over the dark
// hero/CTA marketing landing from the Yandex Pro reference) — the one
// addition here is the CTA button, since Eugene wanted "Оставить заявку" to
// stay even without the hero. See docs/decisions.md, 2026-07-29.
function DriversScreen() {
  const [isRequestSent, setIsRequestSent] = useState(false)

  return (
    <TopicPageScreen title="Водителям" intro={INTRO} topics={TOPICS}>
      <button
        type="button"
        onClick={() => setIsRequestSent(true)}
        disabled={isRequestSent}
        className="rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {isRequestSent ? 'Заявка отправлена' : 'Оставить заявку'}
      </button>
    </TopicPageScreen>
  )
}

export { DriversScreen }
