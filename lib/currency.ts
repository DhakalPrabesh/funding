export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-NP', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

export const CURRENCY_SYMBOL = 'Rs.'
export const CURRENCY_NAME = 'Nepalese Rupee'
