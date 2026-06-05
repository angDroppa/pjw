const HALF_DAY_HOURS = 4

export function calcolaPrezzoBici(
  prezzoGiornata: number,
  prezzoMezzaGiornata: number,
  dataRitiro: Date,
  oraRitiro: string,
  dataConsegna: Date,
  oraConsegna: string
): { prezzo: number; label: string } {
  const pickup = new Date(dataRitiro)
  const ret = new Date(dataConsegna)
  const [rh, rm] = oraRitiro.split(':').map(Number)
  const [ch, cm] = oraConsegna.split(':').map(Number)
  pickup.setHours(rh, rm, 0, 0)
  ret.setHours(ch, cm, 0, 0)

  const hours = (ret.getTime() - pickup.getTime()) / (1000 * 60 * 60)

  if (hours <= 0) return { prezzo: prezzoGiornata, label: '1 giorno' }

  const pickupStr = dataRitiro.toISOString().slice(0, 10)
  const retStr = dataConsegna.toISOString().slice(0, 10)
  const isSameDay = pickupStr === retStr

  if (isSameDay && hours <= HALF_DAY_HOURS) {
    return { prezzo: prezzoMezzaGiornata, label: 'Mezza giornata' }
  }

  if (isSameDay) {
    return { prezzo: prezzoGiornata, label: '1 giorno' }
  }

  const giorni = Math.ceil(hours / 24)
  return { prezzo: prezzoGiornata * giorni, label: `${giorni} giorni` }
}
