export type Event = {
  id: string
  title: string
  description: string
  date: string
  image_url?: string
  category?: string
  created_by: string
  created_at: string
}

export type Rsvp = {
  id: string
  event_id: string
  user_id: string
  status: 'GOING' | 'NOT_GOING'
  created_at: string
}

export type Contact = {
  id: string
  name: string
  email: string
  message: string
  created_at: string
}

