'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const TEXT_LIMIT = 500

export default function NewPrayerForm() {
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    if (text.length > TEXT_LIMIT) {
      alert(`Слишком длинная молитва (максимум ${TEXT_LIMIT} символов)`)
      return
    }

    setLoading(true)
    const { error } = await supabase.from('prayers').insert([{ text, name }])
    setLoading(false)

    if (!error) {
      setSubmitted(true)
      setText('')
      setName('')
      setTimeout(() => setSubmitted(false), 3000)
    } else {
      alert('Ошибка при добавлении 🙏')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-lg space-y-4 border border-gray-200"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Имя (необязательно)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Анна"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Молитвенная нужда
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={TEXT_LIMIT}
          placeholder="Напишите, за что Вы хотите, чтобы помолились..."
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="text-right text-sm text-gray-500">
          {text.length}/{TEXT_LIMIT}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
      >
        {loading ? 'Отправка...' : 'Оставить нужду'}
      </button>

      {submitted && (
        <p className="text-green-600 text-center">Молитва добавлена 🙌</p>
      )}
    </form>
  )
}
