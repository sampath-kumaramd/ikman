import twilio from 'twilio'
import type { Listing } from '../lib/types'

export async function sendWhatsApp(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  message: string,
): Promise<boolean> {
  try {
    const client = twilio(accountSid, authToken)
    await client.messages.create({
      from: `whatsapp:${fromNumber}`,
      to:   `whatsapp:${toNumber}`,
      body: message,
    })
    console.log(`WhatsApp sent to ${toNumber}`)
    return true
  } catch (err) {
    console.error('Twilio WhatsApp error:', (err as Error).message)
    return false
  }
}

export function buildListingMessage(listing: Partial<Listing>): string {
  const price = listing.price ? `Rs. ${listing.price.toLocaleString()}` : 'Price not listed'
  const beds  = listing.bedrooms ? `${listing.bedrooms} BR` : ''
  const type  = listing.listing_type ? ` ${listing.listing_type}` : ' property'
  const area  = listing.area ?? listing.location ?? ''

  const lines = [
    `New${type} for rent in ${area}`,
    `Rs: ${price}/month${beds ? ` - ${beds}` : ''}`,
    `Location: ${listing.location ?? area}`,
  ]

  if (listing.description) {
    lines.push(`${listing.description.slice(0, 200)}${listing.description.length > 200 ? '...' : ''}`)
  }

  if (listing.contact) {
    lines.push(`Contact: ${listing.contact}`)
  }

  lines.push(`Link: ${listing.url}`)

  return lines.join('\n')
}
