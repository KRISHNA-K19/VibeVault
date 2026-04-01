'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { EventCard } from '@/components/event-card'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Event } from '@/types/schema'
import { useUserStore } from '@/store/useUserStore'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { PlusIcon, SearchIcon, CalendarDaysIcon } from 'lucide-react'

export default function EventsListPage() {
  const supabase = createClient()
  const { user, role } = useUserStore()
  const queryClient = useQueryClient()

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['all-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel('realtime-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-events'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/conference-stage.png" alt="Events" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-slate-900/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-4 border border-white/10">
                <CalendarDaysIcon className="w-4 h-4" />
                {events ? `${events.length} Events` : 'Loading...'}
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                All Events
              </h1>
              <p className="mt-4 text-lg text-slate-300 max-w-xl">
                Browse and RSVP to our upcoming community events, hackathons, conferences, and workshops.
              </p>
            </div>
            {role === 'admin' && (
              <Button asChild className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg font-bold rounded-full px-6 h-12 shrink-0">
                <Link href="/create-event">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg inline-block">Failed to load events. Try later.</h3>
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 px-4 bg-white dark:bg-slate-900 rounded-3xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 mb-6">
              <CalendarDaysIcon className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">No events yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
              Events will appear here once they are published. Check back soon for exciting community happenings!
            </p>
            {role === 'admin' && (
              <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-indigo-500/20">
                <Link href="/create-event">Create First Event</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
