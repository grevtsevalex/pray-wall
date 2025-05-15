import NewPrayerForm from '@/components/NewPrayerForm'
import PrayerList from '@/components/PrayerList'

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-2">🕊 Стена Молитв</h1>
      <p className="text-center text-gray-600 mb-8">
        Оставьте молитвенную нужду. Люди смогут помолиться за Вас, просто нажав 🙏.
      </p>
      <NewPrayerForm />
      <hr className="my-10 border-gray-300" />
      <PrayerList />
    </main>
  )
}
