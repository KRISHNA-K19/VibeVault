'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/store/useUserStore'

const ADMIN_EMAIL = 'krishnamoorthyk.cse@gmail.com'

async function syncProfile(supabase: ReturnType<typeof createClient>, userId: string, email: string | undefined, userMeta: Record<string, unknown> | undefined) {
  // Fetch existing profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', userId)
    .maybeSingle()

  const isAdminEmail = email === ADMIN_EMAIL
  let finalRole = profile?.role ?? 'member'
  
  // Determine the name: prefer DB profile, fallback to auth metadata, then email
  const metaName = userMeta?.full_name as string | undefined
  const currentName = profile?.full_name
  const resolvedName = currentName || metaName || email?.split('@')[0] || null

  // Determine if profile needs updating
  const needsRoleUpdate = isAdminEmail && finalRole !== 'admin'
  const needsNameUpdate = !currentName && resolvedName
  const profileMissing = !profile

  if (profileMissing || needsRoleUpdate || needsNameUpdate) {
    const upsertData: Record<string, unknown> = { id: userId }
    
    if (isAdminEmail) {
      upsertData.role = 'admin'
      finalRole = 'admin'
    }
    
    if (resolvedName) {
      upsertData.full_name = resolvedName
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(upsertData, { onConflict: 'id' })
    
    if (error) {
      console.warn('Profile sync failed:', error.message)
      // Still recognize admin client-side even if DB fails
      if (isAdminEmail) finalRole = 'admin'
    }
  }
  
  return finalRole as 'admin' | 'member'
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
      },
    },
  }))
  const setUser = useUserStore((state) => state.setUser)
  const setRole = useUserStore((state) => state.setRole)
  const setAuthLoaded = useUserStore((state) => state.setAuthLoaded)
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = await syncProfile(
          supabase, 
          session.user.id, 
          session.user.email,
          session.user.user_metadata
        )
        setRole(role)
      } else {
        setRole(null)
      }
      setAuthLoaded(true)
    }
    
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = await syncProfile(
          supabase, 
          session.user.id, 
          session.user.email,
          session.user.user_metadata
        )
        setRole(role)
      } else {
        setRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setRole, setAuthLoaded, supabase])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
