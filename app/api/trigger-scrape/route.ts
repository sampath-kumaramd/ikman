import { NextResponse } from 'next/server'

// Triggers the GitHub Actions workflow_dispatch so the user can hit
// "Run Now" from the UI without waiting for the cron schedule.
export async function POST() {
  const token = process.env.GITHUB_PAT
  const owner = process.env.GITHUB_OWNER
  const repo  = process.env.GITHUB_REPO

  if (!token || !owner || !repo) {
    return NextResponse.json(
      { error: 'GITHUB_PAT, GITHUB_OWNER, or GITHUB_REPO env vars are not set' },
      { status: 500 },
    )
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main' }),
  })

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json(
      { error: `GitHub API error: ${res.status} – ${body}` },
      { status: 500 },
    )
  }

  // 204 No Content on success
  return NextResponse.json({ ok: true, message: 'Scrape triggered via GitHub Actions' })
}
