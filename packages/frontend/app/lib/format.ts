const amountFormatter = new Intl.NumberFormat("ja-JP");

export function formatAmount(amount: number | string): string {
  if (typeof amount === "number") {
    return amountFormatter.format(amount);
  }

  if (!/^-?\d+(\.\d+)?$/.test(amount)) {
    return amount;
  }

  const sign = amount.startsWith("-") ? "-" : "";
  const unsignedAmount = sign ? amount.slice(1) : amount;
  const [integerPart, fractionalPart] = unsignedAmount.split(".");
  const groupedIntegerPart = amountFormatter.format(BigInt(integerPart));

  if (!fractionalPart) {
    return `${sign}${groupedIntegerPart}`;
  }

  return `${sign}${groupedIntegerPart}.${fractionalPart}`;
}
