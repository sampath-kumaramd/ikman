import type { Listing } from '../lib/types'

const TELEGRAM_API = 'https://api.telegram.org'

export async function sendTelegram(
  token: string,
  chatId: string,
  message: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('Telegram error:', err.description)
      return false
    }
    console.log(`Telegram message sent to chat ${chatId}`)
    return true
  } catch (err) {
    console.error('Telegram send failed:', (err as Error).message)
    return false
  }
}

let _botUsername: string | null = null

/** Bot username for t.me deep links — fetched once via getMe and cached. */
export async function getBotUsername(token: string): Promise<string | null> {
  if (_botUsername) return _botUsername
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/getMe`)
    const data = await res.json()
    _botUsername = data?.result?.username ?? null
  } catch {
    _botUsername = null
  }
  return _botUsername
}

export function buildListingMessage(listing: Partial<Listing>): string {
  const price = listing.price
    ? `Rs. ${listing.price.toLocaleString()}/mo`
    : 'Price on request'
  const type  = listing.listing_type ?? 'property'
  const area  = listing.area ?? listing.location ?? ''
  const beds  = listing.bedrooms ? `${listing.bedrooms} BR · ` : ''

  const lines: string[] = [
    `🏠 <b>New ${type} for rent — ${area}</b>`,
    `💰 ${price}`,
    `📍 ${beds}${listing.location ?? area}`,
  ]

  if (listing.description) {
    const short = listing.description.slice(0, 200)
    lines.push(`\n${short}${listing.description.length > 200 ? '…' : ''}`)
  }

  if (listing.contact) lines.push(`📞 ${listing.contact}`)

  lines.push(`\n🔗 <a href="${listing.url}">View on ikman</a>`)

  return lines.join('\n')
}
