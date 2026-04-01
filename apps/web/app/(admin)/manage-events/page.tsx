'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUserStore } from '@/store/useUserStore'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PencilIcon, Trash2Icon, PlusIcon, Image as ImageIcon, UsersIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon, TicketCheckIcon } from 'lucide-react'
import type { Event } from '@/types/schema'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Rsvp = {
  id: string
  user_id: string
  status: string
  event_id: string
}

type Profile = {
  id: string
  full_name: string | null
}

export default function ManageEventsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { user, role, isAuthLoaded } = useUserStore()
  const router = useRouter()
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['admin-events'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
  })

  // Fetch ALL rsvps for all events (admin view)
  const { data: allRsvps = [] } = useQuery<Rsvp[]>({
    queryKey: ['all-rsvps-admin'],
    enabled: !!user && role === 'admin',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('id, user_id, status, event_id')
        .eq('status', 'GOING')
      if (error) throw error
      return data as Rsvp[]
    },
  })

  // Fetch profiles for all RSVP users
  const allUserIds = [...new Set(allRsvps.map(r => r.user_id))]
  const { data: allProfiles = [] } = useQuery<Profile[]>({
    queryKey: ['admin-rsvp-profiles', allUserIds.join(',')],
    enabled: allUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', allUserIds)
      if (error) return []
      return data as Profile[]
    },
  })

  // Build profile lookup map
  const profileMap = new Map<string, string>()
  allProfiles.forEach(p => {
    if (p.full_name) profileMap.set(p.id, p.full_name)
  })

  // Get RSVPs for a specific event
  const getRsvpsForEvent = (eventId: string) => {
    return allRsvps.filter(r => r.event_id === eventId)
  }

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('manage-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-events'] })
        queryClient.invalidateQueries({ queryKey: ['all-events'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, () => {
        queryClient.invalidateQueries({ queryKey: ['all-rsvps-admin'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient, user])

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['all-events'] })
      queryClient.invalidateQueries({ queryKey: ['featured-events'] })
    },
  })

  if (!isAuthLoaded) {
    return (
      <div className="flex justify-center py-20 animate-in fade-in">
        <div className="text-slate-500 font-medium">Verifying access...</div>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="flex justify-center flex-col items-center py-20 min-h-[50vh] space-y-4">
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 font-medium tracking-tight text-lg shadow-sm">
          Access Denied. Admins Only.
        </div>
        <Button variant="outline" asChild><Link href="/">Go Home</Link></Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Manage Events</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl">Modify, review attendees, or remove events. All changes are live instantly.</p>
        </div>
        <Button asChild className="shrink-0 h-12 px-6 rounded-full shadow-md shadow-indigo-500/10 bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/create-event">
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
             {[1,2,3].map((i) => (
                <div key={i} className="p-6 flex items-center gap-4">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
                   <div className="flex-1 space-y-2">
                     <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-md w-1/3 animate-pulse"></div>
                     <div className="h-4 bg-slate-50 dark:bg-slate-900 rounded-md w-1/4 animate-pulse"></div>
                   </div>
                </div>
             ))}
          </div>
        ) : events && events.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((event) => {
              const eventRsvps = getRsvpsForEvent(event.id)
              const isExpanded = expandedEvent === event.id
              
              return (
                <li key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative w-full sm:w-24 sm:h-24 aspect-[16/9] sm:aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-800">
                      {event.image_url ? (
                        <Image src={event.image_url} alt={event.title} fill className="object-cover" sizes="96px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                        <Link href={`/events/${event.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {event.title}
                        </Link>
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500 font-medium flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {format(new Date(event.date), 'MMM do, yyyy \u2022 h:mm a')}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className={new Date(event.date) < new Date() ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400"}>
                          {new Date(event.date) < new Date() ? "Past Event" : "Upcoming"}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        {/* Attendee count */}
                        <button
                          onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                          className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold transition-colors"
                        >
                          <UsersIcon className="w-3.5 h-3.5" />
                          {eventRsvps.length} {eventRsvps.length === 1 ? 'Attendee' : 'Attendees'}
                          {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-2xl">{event.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/events/${event.id}`)} className="flex-1 sm:flex-none text-slate-700 dark:text-slate-300">
                        View
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to permanently delete this event?')) {
                            deleteMutation.mutate(event.id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex-1 sm:flex-none bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20 shadow-none"
                      >
                        <Trash2Icon className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {/* Expanded attendee names */}
                  {isExpanded && (
                    <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <TicketCheckIcon className="w-4 h-4 text-emerald-500" />
                          Confirmed Attendees ({eventRsvps.length})
                        </h4>
                        {eventRsvps.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {eventRsvps.map((rsvp) => {
                              const name = profileMap.get(rsvp.user_id) || 'Member'
                              const initial = name.charAt(0).toUpperCase()
                              return (
                                <div key={rsvp.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
                                  <Avatar className="w-9 h-9 ring-2 ring-emerald-100 dark:ring-emerald-800">
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-sm">
                                      {initial}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="overflow-hidden">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</p>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span>
                                      BOOKED
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No attendees have booked this event yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-center py-20 px-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 mb-6">
              <ImageIcon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No events available</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">Start organizing your club activities by creating your first event.</p>
            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Link href="/create-event">Create First Event</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
