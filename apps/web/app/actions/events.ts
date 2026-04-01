'use server'

import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'krishnamoorthyk.cse@gmail.com'

export async function createEventAction(formData: FormData) {
  const supabase = await createClient()
  
  // 1. Verify the user is authenticated and is an admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { success: false, error: 'Authentication required. Please log in again.' }
  }

  // Check admin status via both profile and email
  const isAdminEmail = user.email === ADMIN_EMAIL
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
    
  const isAdmin = isAdminEmail || profile?.role === 'admin'
  
  if (!isAdmin) {
    return { success: false, error: 'Access denied. Only admins can create events.' }
  }

  // 2. If the profile doesn't exist or doesn't have admin role, fix it
  if (!profile || profile.role !== 'admin') {
    if (isAdminEmail) {
      await supabase
        .from('profiles')
        .upsert({ id: user.id, role: 'admin' }, { onConflict: 'id' })
    }
  }

  // 3. Extract form data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const date = formData.get('date') as string
  const category = (formData.get('category') as string) || 'General'
  const imageFile = formData.get('imageFile') as File | null
  
  if (!title || title.length < 3) {
    return { success: false, error: 'Event title must be at least 3 characters.' }
  }
  if (!description || description.length < 10) {
    return { success: false, error: 'Event description must be at least 10 characters.' }
  }
  if (!date) {
    return { success: false, error: 'Event date and time are required.' }
  }

  const eventDate = new Date(date)
  if (isNaN(eventDate.getTime())) {
    return { success: false, error: 'Invalid date format provided.' }
  }

  try {
    let finalImageUrl: string | null = null

    // 4. Upload image if provided
    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const arrayBuffer = await imageFile.arrayBuffer()
      const fileBuffer = new Uint8Array(arrayBuffer)

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        })
      
      if (uploadError) {
        console.error('Image upload failed:', uploadError)
        // Don't fail the entire event creation for an image upload error
        // just continue without the image
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName)
        finalImageUrl = publicUrlData.publicUrl
      }
    }

    // 5. Insert the event
    const payload: Record<string, unknown> = {
      title,
      description,
      date: eventDate.toISOString(),
      category,
      image_url: finalImageUrl,
      created_by: user.id,
    }

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert([payload])
      .select()
      .single()

    if (insertError) {
      // Retry without category if column doesn't exist
      if (insertError.message.includes('category')) {
        delete payload.category
        const { data: retryEvent, error: retryError } = await supabase
          .from('events')
          .insert([payload])
          .select()
          .single()
        
        if (retryError) {
          return { success: false, error: `Failed to create event: ${retryError.message}` }
        }
        return { success: true, event: retryEvent }
      }
      return { success: false, error: `Failed to create event: ${insertError.message}` }
    }

    return { success: true, event: newEvent }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    console.error('Create event action error:', err)
    return { success: false, error: message }
  }
}
