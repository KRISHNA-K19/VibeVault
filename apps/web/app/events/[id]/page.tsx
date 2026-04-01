'use client'

import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, UsersIcon, CheckCircle2Icon, XCircleIcon, ArrowLeftIcon, Loader2Icon, PartyPopperIcon, TicketCheckIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  description: string
  date: string
  image_url?: string
  category?: string
}

type Rsvp = {
  id: string
  user_id: string
  status: 'GOING' | 'NOT_GOING'
}

type Profile = {
  id: string
  full_name: string | null
}

export default function EventDetailsPage() {
  const { id } = useParams()
  const eventId = Array.isArray(id) ? id[0] : id
  
  const supabase = createClient()
  const { user } = useUserStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()
      if (error) throw error
      return data
    },
  })

  // Fetch RSVPs (simple query, no join)
  const { data: rsvps = [], isLoading: rsvpsLoading } = useQuery<Rsvp[]>({
    queryKey: ['rsvps', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('id, user_id, status')
        .eq('event_id', eventId)
      if (error) throw error
      return data as Rsvp[]
    },
  })

  // Fetch profiles for all RSVP users (separate query to avoid FK join issue)
  const goingUserIds = rsvps.filter(r => r.status === 'GOING').map(r => r.user_id)
  const { data: profiles = [] } = useQuery<Profile[]>({
    queryKey: ['rsvp-profiles', eventId, goingUserIds.join(',')],
    enabled: goingUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', goingUserIds)
      if (error) {
        console.warn('Could not fetch profiles:', error.message)
        return []
      }
      return data as Profile[]
    },
  })

  // Build a map of user_id -> name for quick lookup
  const profileMap = new Map<string, string>()
  profiles.forEach(p => {
    if (p.full_name) profileMap.set(p.id, p.full_name)
  })

  const getDisplayName = (userId: string): string => {
    if (user && userId === user.id) {
      return profileMap.get(userId) || user.email?.split('@')[0] || 'You'
    }
    return profileMap.get(userId) || 'Member'
  }

  useEffect(() => {
    const channel = supabase
      .channel('rsvp-realtime-' + eventId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `event_id=eq.${eventId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, queryClient, supabase])

  const rsvpMutation = useMutation({
    mutationFn: async (status: 'GOING' | 'NOT_GOING') => {
      if (!user) throw new Error('Must be logged in to RSVP')
      
      const { data: existing } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('rsvps')
          .update({ status })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('rsvps')
          .insert([{ event_id: eventId, user_id: user.id, status }])
        if (error) throw error
      }

      return status
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['rsvps', eventId] })
      const previousRsvps = queryClient.getQueryData<Rsvp[]>(['rsvps', eventId])
      
      if (user && previousRsvps) {
        const existingIdx = previousRsvps.findIndex(r => r.user_id === user.id)
        const updated = [...previousRsvps]
        
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], status: newStatus }
        } else {
          updated.push({
            id: 'optimistic-' + Date.now(),
            user_id: user.id,
            status: newStatus,
          })
        }
        
        queryClient.setQueryData(['rsvps', eventId], updated)
      }
      
      return { previousRsvps }
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] })
      queryClient.invalidateQueries({ queryKey: ['user-events'] })
      queryClient.invalidateQueries({ queryKey: ['user-rsvps'] })
      queryClient.invalidateQueries({ queryKey: ['user-rsvp'] })
      
      if (status === 'GOING') {
        setShowConfirmation(true)
        setTimeout(() => setShowConfirmation(false), 4000)
      }
    },
    onError: (_err, _status, context) => {
      if (context?.previousRsvps) {
        queryClient.setQueryData(['rsvps', eventId], context.previousRsvps)
      }
    },
  })

  if (eventLoading || rsvpsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 shadow-xl" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full mb-4">
           <XCircleIcon className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">Event Not Found</h2>
        <p className="text-slate-500 max-w-sm mb-6">The event you are looking for does not exist or has been removed.</p>
        <Button asChild variant="outline">
          <Link href="/events"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Events</Link>
        </Button>
      </div>
    )
  }

  const goingRsvps = rsvps.filter((r) => r.status === 'GOING')
  const userRsvp = user ? rsvps.find((r) => r.user_id === user.id) : null
  const isGoing = userRsvp?.status === 'GOING'

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 py-10 px-4 sm:px-6">
      
      <Button variant="ghost" asChild className="mb-4 pl-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
        <Link href="/events"><ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to events</Link>
      </Button>

      {/* Success Toast */}
      {showConfirmation && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30">
            <div className="bg-white/20 p-2 rounded-full">
              <PartyPopperIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">BOOKED Successfully! 🎉</p>
              <p className="text-emerald-100 text-xs">Your spot has been secured for this event.</p>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-0 shadow-2xl shadow-indigo-500/5 ring-1 ring-slate-200/50 dark:ring-slate-800/50 rounded-3xl bg-white dark:bg-slate-950">
        <div className="relative h-64 md:h-[400px] w-full bg-slate-900/5 dark:bg-slate-900 overflow-hidden group">
          {event.image_url ? (
            <Image
               src={event.image_url}
               alt={event.title}
               fill
               priority
               className="object-cover transform transition-transform duration-700 hover:scale-105"
               sizes="(max-width: 1200px) 100vw, 1200px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
          )}

          {/* BOOKED badge on the image */}
          {isGoing && (
            <div className="absolute top-5 right-5 z-20 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30 font-bold text-sm">
              <TicketCheckIcon className="w-4 h-4" />
              BOOKED
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 md:p-10">
            <div>
              {event.category && (
                <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-3">
                  {event.category}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white line-clamp-2 max-w-3xl drop-shadow-md">
                {event.title}
              </h1>
            </div>
          </div>
        </div>
        
        <CardContent className="p-0">
           <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="p-6 md:p-10 col-span-2 space-y-8">
                 <div className="flex items-center gap-6 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                          <CalendarIcon className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Date & Time</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                             {format(new Date(event.date), 'EEEE, MMMM do, yyyy \u2022 h:mm a')}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">About the Event</h3>
                    <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{event.description}</p>
                 </div>
              </div>

              {/* Right sidebar: RSVP */}
              <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-8">
                 <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl">
                    <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                       <h3 className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">RSVP Status</h3>
                       <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-bold">
                          <UsersIcon className="w-4 h-4" />
                          {goingRsvps.length} Going
                       </div>
                    </div>
                    <div className="p-5 space-y-4">
                       {!user ? (
                         <div className="text-center space-y-3">
                            <UsersIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                            <p className="text-sm text-slate-500">You must be logged in to reserve your spot.</p>
                            <Button onClick={() => router.push('/login')} className="w-full shadow-sm rounded-xl h-11 bg-indigo-600 text-white hover:bg-indigo-700">
                               Log in to RSVP
                            </Button>
                         </div>
                       ) : isGoing ? (
                         <>
                           {/* BOOKED confirmation card */}
                           <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
                             <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full shadow-md shadow-emerald-500/30">
                               <CheckCircle2Icon className="w-5 h-5 text-white" />
                             </div>
                             <div>
                               <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">BOOKED</p>
                               <p className="text-xs text-emerald-600 dark:text-emerald-400">Your spot is confirmed!</p>
                             </div>
                           </div>
                           
                           <Button
                             variant="outline"
                             className="w-full rounded-xl border-dashed border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors h-11"
                             onClick={() => rsvpMutation.mutate('NOT_GOING')}
                             disabled={rsvpMutation.isPending}
                           >
                             {rsvpMutation.isPending ? (
                               <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                             ) : (
                               <XCircleIcon className="w-4 h-4 mr-2" />
                             )}
                             Cancel Reservation
                           </Button>
                         </>
                       ) : (
                         <Button
                           className="w-full rounded-xl h-12 font-semibold text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all"
                           onClick={() => rsvpMutation.mutate('GOING')}
                           disabled={rsvpMutation.isPending}
                         >
                           {rsvpMutation.isPending ? (
                             <Loader2Icon className="w-5 h-5 animate-spin mr-2" />
                           ) : (
                             <TicketCheckIcon className="w-5 h-5 mr-2" />
                           )}
                           {rsvpMutation.isPending ? 'Booking...' : "I'm Going"}
                         </Button>
                       )}
                    </div>
                 </Card>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Attendees with NAMES */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
          Attendees
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm px-3 py-1 rounded-full">{goingRsvps.length}</span>
        </h2>
        
        {goingRsvps.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {goingRsvps.map((rsvp) => {
              const isCurrentUser = user && rsvp.user_id === user.id
              const name = getDisplayName(rsvp.user_id)
              const initial = name.charAt(0).toUpperCase()
              
              return (
                <li key={rsvp.id}>
                  <Card className={`flex items-center space-x-4 p-4 rounded-2xl border-0 shadow-sm ring-1 transition-all ${
                    isCurrentUser
                      ? 'ring-emerald-300 dark:ring-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/5'
                      : 'ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                  }`}>
                    <Avatar className={`w-12 h-12 ring-2 ${isCurrentUser ? 'ring-emerald-200 dark:ring-emerald-600' : 'ring-indigo-100 dark:ring-indigo-500/20'}`}>
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-lg">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {name}
                        {isCurrentUser && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">(You)</span>
                        )}
                      </p>
                      <p className="text-xs font-bold tracking-wider text-emerald-600 dark:text-emerald-500 uppercase mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse block"></span>
                        BOOKED
                      </p>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        ) : (
           <div className="flex flex-col items-center justify-center p-14 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
             <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm mb-4">
               <UsersIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
             </div>
             <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No attendees yet</p>
             <p className="text-slate-500 text-center max-w-xs mt-2">Be the first to secure your spot for this exciting event!</p>
           </div>
        )}
      </div>
    </div>
  )
}
