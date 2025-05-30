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
  const [prayerCount, setPrayerCount] = useState(0)
  const [reactionCount, setReactionCount] = useState(0)

  useEffect(() => {
    fetchPrayers()
    fetchCounts()

    const channel = supabase
      .channel('realtime:prayers')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prayers' },
        (payload) => {
          setPrayers((prev) => [payload.new as Prayer, ...prev])
          setPrayerCount((prev) => prev + 1)
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

  const fetchCounts = async () => {
    const { count: prayersCount } = await supabase
      .from('prayers')
      .select('*', { count: 'exact', head: true })

    const { count: reactionsCount } = await supabase
      .from('prayer_reactions')
      .select('*', { count: 'exact', head: true })

    setPrayerCount(prayersCount || 0)
    setReactionCount(reactionsCount || 0)
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
    <div className="mt-10 space-y-4 max-w-xl mx-auto px-4">
      {/* 👇 Счётчики */}
      {!loading && (
        <div className="text-center text-gray-700 text-sm mb-4 space-y-1">
          <p>На стене уже <strong>{prayerCount}</strong> молитвенные нужды</p>
          <p>🙏 За них помолились <strong>{reactionCount}</strong> раз — присоединяйтесь!</p>
        </div>
      )}

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
