'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Prayer = {
  id: string
  text: string
  name?: string
  created_at: string
}

export default function AdminPanel() {
  const router = useRouter()
  const [prayers, setPrayers] = useState<Prayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrayers()
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

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту молитву?')) return

    const { error } = await supabase.from('prayers').delete().eq('id', id)

    if (!error) {
      setPrayers((prev) => prev.filter((p) => p.id !== id))
    } else {
      alert('Ошибка при удалении')
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4 pb-20">
          <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Админ-панель</h1>
      <a
        href="/"
        className="text-sm text-blue-600 hover:underline"
      >
        ← Назад ко всем молитвам
      </a>
    </div>
      {loading ? (
        <p className="text-center text-gray-500">Загрузка...</p>
      ) : prayers.length === 0 ? (
        <p className="text-center text-gray-400">Нет молитв для отображения.</p>
      ) : (
        <ul className="space-y-4">
          {prayers.map((p) => (
            <li key={p.id} className="p-4 border rounded-xl shadow bg-white">
              <p className="text-gray-800 mb-2 whitespace-pre-line">{p.text}</p>
              {p.name && (
                <p className="text-sm text-gray-600 mb-1">Имя: <strong>{p.name}</strong></p>
              )}
              <p className="text-xs text-gray-400 mb-2">
                {new Date(p.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-sm text-red-600 hover:underline"
              >
                🗑 Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}