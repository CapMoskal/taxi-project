import { Baby, CreditCard, Headphones, Lock, ShieldCheck, Umbrella } from 'lucide-react'
import { TopicPageScreen, type Topic } from '@/screens/_shared/TopicPageScreen'

const TOPICS: Topic[] = [
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

const INTRO =
  'Мы делаем поездки на такси комфортнее и безопаснее — постоянно улучшаем стандарты качества и ' +
  'технологии, которые помогают заботиться о пассажирах на каждом этапе поездки.'

// One flat page — intro + a grid of topic cards (Eugene confirmed: cards are
// a visual grouping, not a second navigation level). Styled after the Yandex
// Go reference (docs/decisions.md, 2026-07-28) but with our own taxi-app
// copy, not a clone of theirs (COVID/scooters etc. dropped as irrelevant).
function PassengersScreen() {
  return <TopicPageScreen title="Пассажирам" intro={INTRO} topics={TOPICS} />
}

export { PassengersScreen }
