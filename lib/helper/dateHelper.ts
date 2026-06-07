// lib/helper/dateHelper.ts
export function toInputDate(date: Date | string) {
  const d = new Date(date)
  return d.toISOString().split("T")[0] // YYYY-MM-DD
}