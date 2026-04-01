'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Image as ImageIcon, TicketCheckIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'
import { useQuery } from '@tanstack/react-query'

interface EventCardProps {
  event: {
    id: string
    title: string
    description: string
    date: string
    image_url?: string
    category?: string
  }
}

export function EventCard({ event }: EventCardProps) {
  const { user } = useUserStore()
  const supabase = createClient()

  // Check if user has RSVP'd to this event
  const { data: userRsvp } = useQuery({
    queryKey: ['user-rsvp', event.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('rsvps')
        .select('status')
        .eq('event_id', event.id)
        .eq('user_id', user!.id)
        .maybeSingle()
      return data
    },
    staleTime: 1000 * 30,
  })

  const isBooked = userRsvp?.status === 'GOING'

  return (
    <Card className={`flex flex-col h-full hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-2xl border-0 ring-1 ${
      isBooked 
        ? 'ring-emerald-300 dark:ring-emerald-700 shadow-emerald-500/10' 
        : 'ring-slate-200 dark:ring-slate-800'
    }`}>
      <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20">
            <ImageIcon className="w-10 h-10 text-indigo-300 dark:text-indigo-800" />
          </div>
        )}
        
        {/* Category badge */}
        {event.category && (
          <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
            {event.category}
          </div>
        )}
        
        {/* BOOKED badge */}
        {isBooked && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
            <TicketCheckIcon className="w-3.5 h-3.5" />
            BOOKED
          </div>
        )}
      </div>
      <CardHeader className="pt-5">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-bold tracking-tight">
            {event.title}
          </CardTitle>
        </div>
        <CardDescription className="flex items-center gap-1.5 mt-2 text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide text-xs uppercase">
          <CalendarIcon className="w-4 h-4" />
          {format(new Date(event.date), 'MMM do, yyyy \u2022 h:mm a')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-sm leading-relaxed">
          {event.description}
        </p>
      </CardContent>
      <CardFooter className="pb-5">
        {isBooked ? (
          <Button asChild className="w-full rounded-xl shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all">
            <Link href={`/events/${event.id}`}>
              <TicketCheckIcon className="w-4 h-4 mr-2" />
              BOOKED — View Details
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full rounded-xl shadow-sm hover:shadow transition-all bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Link href={`/events/${event.id}`}>
              View Details
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
