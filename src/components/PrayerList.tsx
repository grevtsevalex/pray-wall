'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Prayer = {
  id: string
  text: string
  name?: string
  created_at: string
  reaction_count: number
}

export default function PrayerList() {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrayers()

    const channel = supabase
      .channel('realtime:prayers')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prayers' },
        (payload) => {
          setPrayers((prev) => [payload.new as Prayer, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prayers' },
        (payload) => {
          setPrayers((prev) =>
            prev.map((p) =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPrayers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setPrayers(data)
    setLoading(false)
  }

  const handleReact = async (prayerId: string) => {
    const reacted = JSON.parse(localStorage.getItem('reacted') || '[]')
    if (reacted.includes(prayerId)) {
      alert('Вы уже молились за эту нужду 🙏')
      return
    }

    await supabase.from('prayer_reactions').insert([{ prayer_id: prayerId }])
    localStorage.setItem('reacted', JSON.stringify([...reacted, prayerId]))
  }

  return (
    <div className="mt-10 space-y-4 max-w-xl mx-auto">
      {loading ? (
        <p className="text-center text-gray-500">Загрузка молитв...</p>
      ) : prayers.length === 0 ? (
        <p className="text-center text-gray-400">Пока нет молитв 🙏</p>
      ) : (
        prayers.map((prayer) => (
          <div key={prayer.id} className="p-4 border rounded-xl shadow">
            <a
              href={`/prayer/${prayer.id}`}
              className="text-lg hover:underline hover:text-blue-700 block transition"
            >
              {prayer.text}
            </a>
            {prayer.name && (
              <p className="text-sm text-gray-600 mt-1">
                Имя: <strong>{prayer.name}</strong>
              </p>
            )}
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>{new Date(prayer.created_at).toLocaleString()}</span>
              <button
                onClick={() => handleReact(prayer.id)}
                className="flex items-center space-x-2 text-blue-700 hover:scale-110 active:scale-95 transition-transform text-lg font-medium"
              >
                <span className="text-2xl animate-none hover:animate-ping-slow">🙏</span>
                <span>{prayer.reaction_count}</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
