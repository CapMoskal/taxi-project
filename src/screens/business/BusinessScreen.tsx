import { useState } from 'react'
import { BadgePercent, ClipboardList, Clock, FileSpreadsheet, Globe, Users } from 'lucide-react'
import { TopicPageScreen, type Topic } from '@/screens/_shared/TopicPageScreen'

const TOPICS: Topic[] = [
  {
    icon: BadgePercent,
    title: 'Экономия',
    description: 'Оптимизируйте транспортные расходы компании и возмещайте НДС по поездкам.',
  },
  {
    icon: ClipboardList,
    title: 'Контроль',
    description: 'Детализация поездок с подробной информацией о стоимости, адресах и времени заказа.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Удобная отчётность',
    description: 'Электронные акты и счета-фактуры. Выгрузка отчётов в Excel за любой период.',
  },
  {
    icon: Users,
    title: 'Развоз сотрудников',
    description: 'Загрузите контакты сотрудников — сервис подскажет оптимальный план рассадки по машинам.',
  },
  {
    icon: Clock,
    title: 'Почасовая аренда',
    description: 'Заказывайте такси на несколько часов — машина остаётся с вами, цена известна заранее.',
  },
  {
    icon: Globe,
    title: 'Доступность',
    description: 'Работаем в городах по всей стране — подключайте сотрудников в любом регионе присутствия.',
  },
]

const INTRO =
  'Такси для бизнеса — упростите организацию рабочих поездок сотрудников и оптимизируйте ' +
  'транспортные расходы компании.'

// Same flat info-page shape as Пассажирам/Водителям — third and last tab in
// this line of features. Reference (business.go.yandex) is again a
// marketing hero (yellow card, two CTAs, "700 городов") — per Eugene's call
// on Водителям we keep the calm info-page style everywhere; the "fancier"
// card redesign is a separate future feature that will touch TopicPageScreen
// and update all three pages at once. See docs/decisions.md, 2026-07-29.
function BusinessScreen() {
  const [isRequestSent, setIsRequestSent] = useState(false)

  return (
    <TopicPageScreen title="Бизнесу" intro={INTRO} topics={TOPICS}>
      <button
        type="button"
        onClick={() => setIsRequestSent(true)}
        disabled={isRequestSent}
        className="rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {isRequestSent ? 'Заявка отправлена' : 'Подключить компанию'}
      </button>
    </TopicPageScreen>
  )
}

export { BusinessScreen }
