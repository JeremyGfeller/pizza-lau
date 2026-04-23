export function toCents(value: number) {
  return Math.round(value * 100);
}

export function fromDecimal(value: string | number | { toString(): string } | null | undefined) {
  if (value == null) {
    return 0;
  }
  if (typeof value === "object") {
    return Number(value.toString());
  }
  return typeof value === "number" ? value : Number(value);
}

export function roundChf(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatChf(value: number) {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(value);
}
