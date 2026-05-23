import type { Listing } from '../lib/types'

const CALLMEBOT_BASE = 'https://api.callmebot.com/whatsapp.php'

export async function sendWhatsApp(
  phone: string,
  apiKey: string,
  message: string,
): Promise<boolean> {
  const params = new URLSearchParams({
    phone,
    text: message,
    apikey: apiKey,
  })

  try {
    const res = await fetch(`${CALLMEBOT_BASE}?${params}`)
    if (!res.ok) {
      console.error(`WhatsApp send failed: HTTP ${res.status}`)
      return false
    }
    const body = await res.text()
    console.log('WhatsApp response:', body)
    return true
  } catch (err) {
    console.error('WhatsApp send error:', (err as Error).message)
    return false
  }
}

export function buildListingMessage(listing: Partial<Listing>): string {
  const price = listing.price ? `Rs. ${listing.price.toLocaleString()}` : 'Price not listed'
  const beds = listing.bedrooms ? `${listing.bedrooms} BR` : ''
  const type = listing.listing_type ? ` ${listing.listing_type}` : ' property'
  const area = listing.area ?? listing.location ?? ''

  const lines = [
    `🏠 New${type} for rent in ${area}`,
    `💰 ${price}/month${beds ? ` · ${beds}` : ''}`,
    `📍 ${listing.location ?? area}`,
  ]

  if (listing.description) {
    lines.push(`📝 ${listing.description.slice(0, 150)}${listing.description.length > 150 ? '…' : ''}`)
  }

  if (listing.contact) {
    lines.push(`📞 ${listing.contact}`)
  }

  lines.push(`🔗 ${listing.url}`)

  return lines.join('\n')
}
