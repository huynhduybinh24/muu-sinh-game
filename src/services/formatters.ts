export const formatMoney = (amount: number): string =>
  `${new Intl.NumberFormat('vi-VN').format(amount)}đ`
