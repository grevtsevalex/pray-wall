'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, notFound } from 'next/navigation'

type Prayer = {
  id: string
  text: string
  name?: string
  created_at: string
  reaction_count: number
}

export default function PrayerPage() {
  const { id } = useParams()
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
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded-xl shadow space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-center">Стена молитв</h1>
        <p className="text-sm text-center text-gray-600">
          Делитесь нуждами, молитесь друг за друга 🙏
        </p>
      </div>

      <div className="p-4 border rounded-xl bg-white space-y-3">
        <p className="text-lg">{prayer.text}</p>
        {prayer.name && (
          <p className="text-sm text-gray-600">Имя: <strong>{prayer.name}</strong></p>
        )}
        <p className="text-sm text-gray-400">
          Опубликовано: {new Date(prayer.created_at).toLocaleString()}
        </p>

        <button
          onClick={handleReact}
          className="mt-4 flex items-center space-x-2 text-blue-700 hover:scale-105 active:scale-95 transition-transform text-lg font-medium"
        >
          <span className="text-2xl">🙏</span>
          <span>{prayer.reaction_count}</span>
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            alert('Ссылка скопирована 🙌')
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Скопировать ссылку
        </button>
      </div>
    </div>
  )
}

