'use client'

export const dynamic = 'force-dynamic'

import { useUserStore } from '@/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCard } from '@/components/event-card'
import { CalendarIcon, UsersIcon, CheckCircle2Icon, PlusIcon, CompassIcon, SettingsIcon, MessageSquareIcon } from 'lucide-react'
import type { Event } from '@/types/schema'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, role } = useUserStore()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch Member's Upcoming Events
  const { data: userEvents = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['user-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rsvps } = await supabase
        .from('rsvps')
        .select('event_id')
        .eq('user_id', user!.id)
        .eq('status', 'GOING')
      
      if (!rsvps || rsvps.length === 0) return []

      const eventIds = rsvps.map(r => r.event_id)
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .order('date', { ascending: true })
      
      if (error) throw error
      return events
    }
  })

  // Fetch Admin Stats
  const { data: systemStats } = useQuery({
    queryKey: ['system-stats'],
    enabled: role === 'admin',
    queryFn: async () => {
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true })
      const { count: rsvpCount } = await supabase.from('rsvps').select('*', { count: 'exact', head: true }).eq('status', 'GOING')
      const { count: msgCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
      return { eventCount: eventCount || 0, rsvpCount: rsvpCount || 0, msgCount: msgCount || 0 }
    }
  })

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-events', user.id] })
        if (role === 'admin') queryClient.invalidateQueries({ queryKey: ['system-stats'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvps' }, () => {
        queryClient.invalidateQueries({ queryKey: ['user-events', user.id] })
        if (role === 'admin') queryClient.invalidateQueries({ queryKey: ['system-stats'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        if (role === 'admin') queryClient.invalidateQueries({ queryKey: ['system-stats'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient, user, role])

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 py-10 px-4 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-600 dark:bg-indigo-950 p-8 sm:p-10 rounded-3xl shadow-xl shadow-indigo-500/10 text-white overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Welcome back, {user?.email?.split('@')[0]} 👋
          </h1>
          <p className="text-indigo-100 max-w-xl text-lg opacity-90">
            {role === 'admin' 
              ? "You're at the command center. Oversee your community, create unmissable tech events, and watch your club's global footprint grow." 
              : "Here is your personal command center. Discover new meetups, track your upcoming events, and connect with your community."}
          </p>
        </div>
        
        {role === 'admin' && (
           <div className="relative z-10 shrink-0">
             <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-8 h-14 rounded-2xl shadow-lg border-2 border-transparent transition-all hover:scale-105">
               <Link href="/create-event">
                 <PlusIcon className="w-5 h-5 mr-2" />
                 Launch New Event
               </Link>
             </Button>
           </div>
        )}

        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Personal RSVP Stat */}
        <Card className="rounded-3xl border-0 ring-1 ring-slate-200/50 dark:ring-slate-800/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Your RSVPs</CardTitle>
            <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl">
               <CheckCircle2Icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-50">{eventsLoading ? '...' : userEvents.length}</div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
               <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
               Active Commitments
            </p>
          </CardContent>
        </Card>
        
        {role === 'admin' && (
          <>
            <Card className="rounded-3xl border-0 ring-1 ring-slate-200/50 dark:ring-slate-800/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Hosted Events</CardTitle>
                <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl">
                   <CalendarIcon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-50">{systemStats ? systemStats.eventCount : '...'}</div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                   Lifetime public events
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 ring-1 ring-slate-200/50 dark:ring-slate-800/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Global Attendees</CardTitle>
                <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl">
                   <UsersIcon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-50">{systemStats ? systemStats.rsvpCount : '...'}</div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                   Total platform RSVPs
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 ring-1 ring-slate-200/50 dark:ring-slate-800/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Inbox</CardTitle>
                <div className="p-2 bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 rounded-xl">
                   <MessageSquareIcon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-50">{systemStats ? systemStats.msgCount : '...'}</div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                   Contact form messages
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Admin Quick Actions */}
      {role === 'admin' && (
         <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
              <SettingsIcon className="w-5 h-5 mr-3 text-indigo-500" />
              Administrative Toolkit
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/create-event" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-center group cursor-pointer shadow-sm">
                 <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-slate-900 dark:text-slate-100">Create New Event</h3>
                 <p className="text-sm text-slate-500 mt-1">Publish a new gathering</p>
              </Link>

              <Link href="/manage-events" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-center group cursor-pointer shadow-sm">
                 <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <SettingsIcon className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-slate-900 dark:text-slate-100">Manage Events</h3>
                 <p className="text-sm text-slate-500 mt-1">Edit or Delete your events</p>
              </Link>

              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-sm opacity-60">
                 <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <UsersIcon className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-slate-900 dark:text-slate-100">Manage Members</h3>
                 <p className="text-sm text-slate-500 mt-1">Coming Soon</p>
              </div>
            </div>
         </div>
      )}

      {/* User's Itinerary */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
             <CalendarIcon className="w-6 h-6 mr-3 text-indigo-500" /> 
             Your Itinerary
           </h2>
           <Button variant="ghost" asChild className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 font-semibold rounded-full hidden sm:flex">
             <Link href="/events">Explore More Events</Link>
           </Button>
        </div>
        
        {eventsLoading ? (
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <div className="h-[350px] rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
           </div>
        ) : userEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 py-16 px-4">
            <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 mb-6 shadow-sm">
                <CompassIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Your schedule is wide open</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg leading-relaxed">
                You haven't locked in your spot for any upcoming gatherings. Great minds are gathering—don't miss out.
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full shadow-lg shadow-indigo-500/20 px-8 h-12">
                <Link href="/events">Browse Live Events</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
