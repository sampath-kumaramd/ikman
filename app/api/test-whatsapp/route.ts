import { NextResponse } from 'next/server'
import { sendWhatsApp } from '../../../scraper/whatsapp'

export async function POST() {
  const accountSid  = process.env.TWILIO_ACCOUNT_SID
  const authToken   = process.env.TWILIO_AUTH_TOKEN
  const fromNumber  = process.env.TWILIO_FROM_NUMBER
  const toNumber    = process.env.WHATSAPP_NUMBER

  const missing = [
    !accountSid  && 'TWILIO_ACCOUNT_SID',
    !authToken   && 'TWILIO_AUTH_TOKEN',
    !fromNumber  && 'TWILIO_FROM_NUMBER',
    !toNumber    && 'WHATSAPP_NUMBER',
  ].filter(Boolean)

  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Missing env vars: ${missing.join(', ')}` },
      { status: 500 },
    )
  }

  const message = `ikman tracker test ✅\nTwilio connection is working.\n${new Date().toLocaleString('en-LK', { timeZone: 'Asia/Colombo' })}`

  const sent = await sendWhatsApp(accountSid!, authToken!, fromNumber!, toNumber!, message)

  if (sent) {
    return NextResponse.json({ ok: true, message: `Test message sent to ${toNumber}` })
  } else {
    return NextResponse.json(
      { ok: false, error: 'Twilio returned an error — check server logs for details' },
      { status: 502 },
    )
  }
}
