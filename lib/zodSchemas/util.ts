import { z } from 'zod'

export const decimalToNumber = z
  .union([
    z.number(),
    z.custom<{ toNumber: () => number }>(val =>
      val !== null &&
      typeof val === 'object' &&
      'toNumber' in (val as object) &&
      typeof (val as { toNumber: unknown }).toNumber === 'function'
    ),
  ])
  .transform(val =>
    typeof val === 'number' ? val : (val as { toNumber: () => number }).toNumber()
  )