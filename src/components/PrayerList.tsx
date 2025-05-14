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
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setPrayers(data)
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
      {prayers.map((prayer) => (
        <div key={prayer.id} className="p-4 border rounded-xl shadow">
          <p className="text-lg">{prayer.text}</p>
          {prayer.name && (
            <p className="text-sm text-gray-600 mt-1">
              Имя: <strong>{prayer.name}</strong>
            </p>
          )}
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <span>{new Date(prayer.created_at).toLocaleString()}</span>
            <button
              onClick={() => handleReact(prayer.id)}
              className="flex items-center space-x-1 text-blue-600 hover:underline"
            >
              🙏 <span>{prayer.reaction_count}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}