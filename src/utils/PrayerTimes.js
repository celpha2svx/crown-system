import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan'

// Set your location - update this to your city
const coordinates = new Coordinates(6.5244, 3.3792) // Lagos, Nigeria
const params = CalculationMethod.MuslimWorldLeague()

export function getPrayerTimes(date) {
  const prayerTimes = new PrayerTimes(coordinates, date, params)
  
  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha
  }
}

export function canPrayerBeChecked(prayerName, date = new Date()) {
  const times = getPrayerTimes(date)
  const prayerTime = times[prayerName]
  
  if (!prayerTime) return false
  
  const now = new Date()
  const gracePeriod = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
  
  // For Fajr: from prayer time until sunrise
  if (prayerName === 'fajr') {
    return now >= prayerTime && now <= times.sunrise
  }
  
  // For other prayers: from prayer time until prayer time + 2 hours
  const timeWindowEnd = new Date(prayerTime.getTime() + gracePeriod)
  
  // Don't allow checking before prayer time
  if (now < prayerTime) return false
  
  // Don't allow checking after window closes (but before next prayer)
  if (now > timeWindowEnd) return false
  
  return true
}

export function getNextPrayer() {
  const now = new Date()
  const times = getPrayerTimes(now)
  
  const prayers = [
    { name: 'fajr', time: times.fajr },
    { name: 'dhuhr', time: times.dhuhr },
    { name: 'asr', time: times.asr },
    { name: 'maghrib', time: times.maghrib },
    { name: 'isha', time: times.isha }
  ]
  
  // Find next prayer
  for (let prayer of prayers) {
    if (prayer.time > now) {
      return prayer
    }
  }
  
  // If no prayer today, return first prayer of tomorrow
  return { name: 'fajr', time: times.fajr }
}