'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'
import type { Event } from '@/types/schema'
import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, Maximize2Icon, CalendarIcon, PlayIcon, SparklesIcon, UsersIcon, WrenchIcon } from 'lucide-react'

// Fallback images for when no events exist
const FALLBACK_GALLERY = [
  { id: 'demo-1', title: 'Winter 2026 Hackathon', date: '2026-01-15', image: '/images/hackathon-event.png', category: 'Hackathon' },
  { id: 'demo-2', title: 'Global Future Summit', date: '2026-02-10', image: '/images/conference-stage.png', category: 'Conference' },
  { id: 'demo-3', title: 'AI & ML Workshop Series', date: '2026-02-28', image: '/images/workshop-session.png', category: 'Workshop' },
  { id: 'demo-4', title: 'Founders Mixer Night', date: '2026-03-05', image: '/images/networking-event.png', category: 'Networking' },
  { id: 'demo-5', title: 'Community Kickoff Meetup', date: '2026-01-20', image: '/images/hero-community.png', category: 'General' },
  { id: 'demo-6', title: 'Team Building Retreat', date: '2026-03-15', image: '/images/about-team.png', category: 'Social' },
]

export default function GalleryPage() {
  const supabase = createClient()

  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['gallery-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .not('image_url', 'is', null)
        .order('date', { ascending: false })

      if (error) throw error
      return data
    },
  })

  // Use real events if available, otherwise use fallback
  const hasRealEvents = events && events.length > 0
  const displayItems = hasRealEvents
    ? events.map(e => ({ id: e.id, title: e.title, date: e.date, image: e.image_url!, category: e.category || 'General', isReal: true }))
    : FALLBACK_GALLERY.map(e => ({ ...e, isReal: false }))

  // Group by category
  const categoriesMap = new Map<string, typeof displayItems>()
  displayItems.forEach(item => {
    const cat = item.category
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, [])
    categoriesMap.get(cat)!.push(item)
  })

  const getCategoryTheme = (category: string) => {
    switch(category.toLowerCase()) {
      case 'hackathon': return { icon: PlayIcon, title: 'Hackathons & Builds', desc: 'Where late nights turned into incredible prototypes and groundbreaking startups.', gradient: 'from-purple-600 to-indigo-600' }
      case 'conference': return { icon: SparklesIcon, title: 'Conferences & Summits', desc: 'Global thought leaders, deep dives, and transformative ideas shared on our stages.', gradient: 'from-cyan-600 to-blue-600' }
      case 'workshop': return { icon: WrenchIcon, title: 'Deep Dive Workshops', desc: 'Intensive sessions focused on skill-building and hands-on learning.', gradient: 'from-amber-600 to-orange-600' }
      case 'networking': return { icon: UsersIcon, title: 'Mixers & Networking', desc: 'The spontaneous moments where handshakes turned into lifelong partnerships.', gradient: 'from-emerald-600 to-teal-600' }
      default: return { icon: ImageIcon, title: category + ' Events', desc: 'Highlights from our vibrant community gatherings.', gradient: 'from-slate-600 to-slate-700' }
    }
  }

  // Aspect ratios for masonry effect
  const aspects = ['aspect-[4/5]', 'aspect-square', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-square']

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/hero-community.png" alt="Gallery hero" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/70 to-slate-50 dark:to-slate-950" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Moments</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            A visual journey through our events. Discover the vibrant energy, the focused builds, and the collaborative spirit that defines our club.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 pb-24">
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse aspect-square w-full break-inside-avoid" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 px-4">
            <h3 className="text-lg font-medium text-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg inline-block">Failed to load gallery. Try later.</h3>
          </div>
        ) : (
          <div className="space-y-24">
            {Array.from(categoriesMap.entries()).map(([category, catItems]) => {
               const theme = getCategoryTheme(category)
               const Icon = theme.icon
               
               return (
                 <div key={category} className="space-y-10">
                   {/* Category Header */}
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                     <div className="flex items-start gap-4">
                       <div className={`p-3 bg-gradient-to-br ${theme.gradient} text-white rounded-2xl hidden sm:flex items-center justify-center shadow-lg`}>
                         <Icon className="w-7 h-7" />
                       </div>
                       <div>
                         <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                           {theme.title}
                         </h2>
                         <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-2xl">{theme.desc}</p>
                       </div>
                     </div>
                     <div className="text-sm font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full inline-flex self-start">
                       {catItems.length} Captured
                     </div>
                   </div>

                   {/* Masonry Grid */}
                   <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                     {catItems.map((item, idx) => (
                       <div key={item.id} className="group relative break-inside-avoid rounded-3xl overflow-hidden shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-800/50 hover:shadow-xl transition-shadow duration-300">
                         <div className={`relative w-full ${aspects[idx % aspects.length]} bg-slate-100 dark:bg-slate-900`}>
                           <Image
                             src={item.image}
                             alt={item.title}
                             fill
                             loading="lazy"
                             className="object-cover transition-transform duration-700 group-hover:scale-110"
                             sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                             unoptimized={!item.isReal}
                           />
                           
                           {/* Badge */}
                           <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-20">
                             {item.isReal ? 'Throwback' : 'Preview'}
                           </div>
                         </div>
                         
                         {/* Hover Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 md:p-8">
                           <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                             <h3 className="text-white font-bold text-xl leading-tight line-clamp-2">{item.title}</h3>
                             <p className="text-indigo-300 font-semibold text-sm mt-2 mb-5 flex items-center gap-1.5">
                               <CalendarIcon className="w-4 h-4" /> 
                               {new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                             </p>
                             {item.isReal && (
                               <Link 
                                 href={`/events/${item.id}`} 
                                 className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full"
                               >
                                 Experience Event
                                 <Maximize2Icon className="w-4 h-4" />
                               </Link>
                             )}
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
