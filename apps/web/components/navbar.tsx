'use client'

import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Button } from './ui/button'
import { CalendarDaysIcon, LayoutDashboardIcon, CalendarPlusIcon, LogOutIcon, MenuIcon, XIcon, SettingsIcon, HomeIcon, InfoIcon, Image as ImageIcon, FileTextIcon, MailIcon, UserIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { user, role, clearAuth } = useUserStore()
  const supabase = createClient()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    clearAuth()
    setLoading(false)
    window.location.href = '/'
  }

  const primaryNavItems = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'About', href: '/about', icon: InfoIcon },
    { label: 'Events', href: '/events', icon: CalendarDaysIcon },
    { label: 'Gallery', href: '/gallery', icon: ImageIcon },
    { label: 'Manifesto', href: '/manifesto', icon: FileTextIcon },
    { label: 'Contact', href: '/contact', icon: MailIcon },
  ]

  const userItems = []
  
  if (user) {
    userItems.push({ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon })
  }

  if (role === 'admin') {
    userItems.push({ label: 'Create Event', href: '/create-event', icon: CalendarPlusIcon })
    userItems.push({ label: 'Manage Events', href: '/manage-events', icon: SettingsIcon })
  }

  const allItems = [...primaryNavItems, ...userItems]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-indigo-600/20">
                <CalendarDaysIcon className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase">
                ClubHouse
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {primaryNavItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-semibold rounded-full transition-colors ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50'}`}
                >
                  {item.label}
                </Link>
              )
            })}
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-4" />

            {userItems.map((item) => {
               const active = pathname === item.href || pathname.startsWith(item.href)
               return (
                 <Link
                   key={item.href}
                   href={item.href}
                   className={`px-3 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50'}`}
                 >
                   {item.label}
                 </Link>
               )
            })}

            {user ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={loading}
                className="ml-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/10 font-semibold transition-colors"
              >
                {loading ? 'Logging out...' : <LogOutIcon className="w-4 h-4" />}
              </Button>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <Button variant="ghost" asChild className="rounded-full font-semibold">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full px-6 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 absolute w-full shadow-2xl pb-4 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <div className="px-4 pt-4 pb-3 space-y-1.5">
            {allItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-semibold transition-colors ${active ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.label}
                </Link>
              )
            })}
            
            <div className="border-t border-slate-200 dark:border-slate-800 my-4 mx-4" />
            
            <div className="px-2">
              {user ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  disabled={loading}
                  className="w-full justify-start rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 h-12"
                >
                  <LogOutIcon className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild className="w-full justify-center rounded-xl h-12 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild className="w-full justify-center rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20">
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
