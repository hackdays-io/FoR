const amountFormatter = new Intl.NumberFormat("ja-JP");

/**
 * 小数第2位以下に端数があれば小数第1位へ切り上げる。
 * 整数部は桁あふれ（例: 999.95 → 1000）も含めて BigInt で正確に扱う。
 */
function ceilToFirstDecimal(unsigned: string): string {
  const [rawInt, frac = ""] = unsigned.split(".");
  let intPart = rawInt || "0";
  let decimal = frac.slice(0, 1);

  if (/[1-9]/.test(frac.slice(1))) {
    let d = Number(decimal || "0") + 1;
    if (d >= 10) {
      intPart = (BigInt(intPart) + 1n).toString();
      d = 0;
    }
    decimal = String(d);
  }

  const groupedIntegerPart = amountFormatter.format(BigInt(intPart));
  return decimal && decimal !== "0"
    ? `${groupedIntegerPart}.${decimal}`
    : groupedIntegerPart;
}

export function formatAmount(amount: number | string): string {
  const raw = typeof amount === "number" ? amount.toString() : amount;

  if (!/^-?\d+(\.\d+)?$/.test(raw)) {
    return raw;
  }

  const sign = raw.startsWith("-") ? "-" : "";
  const unsignedAmount = sign ? raw.slice(1) : raw;
  return `${sign}${ceilToFirstDecimal(unsignedAmount)}`;
}
