import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { password } = body

  if (password === process.env.ADMIN_PASSWORD) {
    const res = NextResponse.json({ success: true })
    res.cookies.set('admin', '1', { httpOnly: true })
    return res
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
