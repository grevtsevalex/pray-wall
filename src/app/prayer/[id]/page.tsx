'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter, notFound } from 'next/navigation'

type Prayer = {
  id: string
  text: string
  name?: string
  created_at: string
  reaction_count: number
}

export default function PrayerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [prayer, setPrayer] = useState<Prayer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrayer()
  }, [])

  const fetchPrayer = async () => {
    const { data } = await supabase
      .from('prayers')
      .select('*')
      .eq('id', id)
      .single()

    if (data) setPrayer(data)
    setLoading(false)
  }

  const handleReact = async () => {
    if (!prayer) return

    const reacted = JSON.parse(localStorage.getItem('reacted') || '[]')
    if (reacted.includes(prayer.id)) {
      alert('Вы уже молились за эту нужду 🙏')
      return
    }

    const { error } = await supabase
      .from('prayer_reactions')
      .insert([{ prayer_id: prayer.id }])

    if (!error) {
      localStorage.setItem('reacted', JSON.stringify([...reacted, prayer.id]))
      setPrayer({ ...prayer, reaction_count: prayer.reaction_count + 1 })
    }
  }

  if (loading) {
    return <p className="text-center text-gray-500 mt-10">Загрузка...</p>
  }

  if (!prayer) return notFound()

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6 px-4">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Стена молитв</h1>
        <p className="text-sm text-gray-600">
          Делитесь нуждами, молитесь друг за друга 🙏
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
        <p className="text-lg text-gray-800 whitespace-pre-line">{prayer.text}</p>

        {prayer.name && (
          <p className="text-sm text-gray-600">Имя: <strong>{prayer.name}</strong></p>
        )}

        <p className="text-sm text-gray-400">
          Опубликовано: {new Date(prayer.created_at).toLocaleString()}
        </p>

        <button
          onClick={handleReact}
          className="mt-2 flex items-center space-x-2 text-blue-700 hover:scale-105 active:scale-95 transition-transform text-lg font-medium"
        >
          <span className="text-2xl">🙏</span>
          <span>{prayer.reaction_count}</span>
        </button>
      </div>

        <div className="flex flex-col items-center gap-3">
        <button
            onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            alert('Ссылка скопирована 🙌')
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
            Скопировать ссылку
        </button>

        <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:underline"
        >
            ← Назад ко всем молитвам
        </button>
        </div>

    </div>
  )
}
