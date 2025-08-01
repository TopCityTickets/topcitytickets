"use client"
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function SubmitEventPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    price: '',
    category: '',
    capacity: '100',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Create event submission
      const { error: submissionError } = await supabase
        .from('event_submissions')
        .insert([
          {
            seller_id: session.user.id,
            title: formData.title,
            description: formData.description,
            date: formData.date,
            time: formData.time,
            venue: formData.venue,
            price: parseFloat(formData.price),
            category: formData.category,
            capacity: parseInt(formData.capacity),
            status: 'pending'
          }
        ])

      if (submissionError) throw submissionError

      router.push('/seller/dashboard?submitted=true')
    } catch (err: any) {
      console.error('Error submitting event:', err)
      setError(err.message || 'Failed to submit event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Submit New Event</h1>
          <p className="text-gray-400">
            Fill out the form below to submit your event for approval
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Event Title
            </label>
            <Input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-black/40 border-gray-800 text-white"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/40 border-gray-800 text-white"
              placeholder="Describe your event"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Date
              </label>
              <Input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-black/40 border-gray-800 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Time
              </label>
              <Input
                required
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-black/40 border-gray-800 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Venue
            </label>
            <Input
              required
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full bg-black/40 border-gray-800 text-white"
              placeholder="Enter venue name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Ticket Price ($)
              </label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-black/40 border-gray-800 text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-black/40 border-gray-800 text-white rounded-md p-2"
              >
                <option value="">Select category</option>
                <option value="music">Music</option>
                <option value="sports">Sports</option>
                <option value="theater">Theater</option>
                <option value="comedy">Comedy</option>
                <option value="arts">Arts & Culture</option>
                <option value="food">Food & Drink</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Maximum Capacity
            </label>
            <Input
              required
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full bg-black/40 border-gray-800 text-white"
              placeholder="Enter maximum number of tickets"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
            >
              {loading ? 'Submitting...' : 'Submit Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
