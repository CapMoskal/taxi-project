import { useState } from 'react'
import { ScreenHeader } from '@/shared/ui/ScreenHeader'
import { useNavigation } from '@/app/navigationContext'

const FAQ_ITEMS = [
  {
    question: 'Как отменить заказ?',
    answer: 'На экране поиска водителя нажмите «Отменить заказ» — деньги за поездку не списываются.',
  },
  {
    question: 'Водитель не приехал вовремя, что делать?',
    answer: 'Проверьте позицию машины на карте — иногда она задерживается в пробке. Если водитель не выходит на связь дольше 5 минут, отмените заказ и закажите новый.',
  },
  {
    question: 'Как изменить способ оплаты?',
    answer: 'Профиль → Способы оплаты — там можно добавить карту или переключиться на оплату наличными.',
  },
  {
    question: 'Где посмотреть прошлые поездки?',
    answer: 'Профиль → История поездок — там весь список с датой, маршрутом и стоимостью.',
  },
]

function SupportScreen() {
  const { navigate } = useNavigation()
  const [isMessageSent, setIsMessageSent] = useState(false)

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <ScreenHeader title="Поддержка" onBack={() => navigate('profile')} />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-border p-3 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                  {item.question}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMessageSent(true)}
            disabled={isMessageSent}
            className="rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
          >
            {isMessageSent ? 'Сообщение отправлено' : 'Написать в поддержку'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { SupportScreen }
