const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function formatCurrencyRUB(amount: number): string {
  return currencyFormatter.format(amount)
}
