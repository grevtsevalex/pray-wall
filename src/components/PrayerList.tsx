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

const PAGE_SIZE = 20

export default function PrayerList() {
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [prayerCount, setPrayerCount] = useState<number | null>(null)
  const [reactionCount, setReactionCount] = useState<number | null>(null)

  useEffect(() => {
    fetchPrayers(1)
    fetchStats()

    const channel = supabase
      .channel('realtime:prayers')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prayers' },
        (payload) => {
          setPrayers((prev) => [payload.new as Prayer, ...prev])
          setPrayerCount((prev) => (prev ?? 0) + 1)
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'prayer_reactions' },
        () => {
          setReactionCount((prev) => (prev ?? 0) + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPrayers = async (pageNumber: number) => {
    setLoading(true)
    const from = (pageNumber - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (data) {
      setPrayers((prev) => (pageNumber === 1 ? data : [...prev, ...data]))
      setHasMore(data.length === PAGE_SIZE)
    } else {
      setHasMore(false)
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const [prayersRes, reactionsRes] = await Promise.all([
      supabase.from('prayers').select('id', { count: 'exact', head: true }),
      supabase.from('prayer_reactions').select('id', { count: 'exact', head: true }),
    ])
    if (prayersRes.count !== null) setPrayerCount(prayersRes.count)
    if (reactionsRes.count !== null) setReactionCount(reactionsRes.count)
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
      {/* 👇 Счётчики */}
      {!loading && (
        <div className="text-center text-gray-700 text-sm mb-4 space-y-1">
          <p>На стене уже <strong>{prayerCount}</strong> молитвенные нужды</p>
          <p>🙏 За них помолились <strong>{reactionCount}</strong> раз — присоединяйтесь!</p>
        </div>
      )}

      {loading && prayers.length === 0 ? (
        <p className="text-center text-gray-500">Загрузка молитв...</p>
      ) : prayers.length === 0 ? (
        <p className="text-center text-gray-400">Пока нет молитв 🙏</p>
      ) : (
        <>
          {prayers.map((prayer) => (
            <div 
              key={prayer.id} 
              className="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
            >
              <a
                href={`/prayer/${prayer.id}`}
                className="block text-lg text-gray-800 leading-relaxed hover:text-blue-600 transition-colors duration-200"
              >
                {prayer.text}
              </a>
              {prayer.name && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                    {prayer.name.charAt(0).toUpperCase()}
                  </span>
                  <span>{prayer.name}</span>
                </div>
              )}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {new Date(prayer.created_at).toLocaleString()}
                </span>
                <button
                  onClick={() => handleReact(prayer.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                >
                  <span className="text-xl animate-none hover:animate-ping-slow">🙏</span>
                  <span className="font-medium">{prayer.reaction_count}</span>
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => {
                  const nextPage = page + 1
                  setPage(nextPage)
                  fetchPrayers(nextPage)
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Показать ещё
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
