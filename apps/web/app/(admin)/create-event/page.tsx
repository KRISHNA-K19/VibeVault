'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { createEventAction } from '@/app/actions/events'
import { UploadCloudIcon, ImageIcon, XIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import Image from 'next/image'

import { useQueryClient } from '@tanstack/react-query'

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, "Date and time are required"),
  category: z.string().min(2, 'Category is required'),
})

type EventForm = z.infer<typeof eventSchema>

export default function CreateEventPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { user, role, isAuthLoaded } = useUserStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: { category: 'General' },
  })

  // Ensure that only admins can hit this page
  if (!isAuthLoaded) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh] animate-in fade-in">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <Loader2Icon className="w-5 h-5 animate-spin" />
          Verifying access...
        </div>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="flex justify-center flex-col items-center py-20 min-h-[40vh] space-y-4">
        <div className="bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/50 font-medium shadow-sm">
          Access Denied. Only admins can create events.
        </div>
        <Button variant="outline" asChild><Link href="/">Go Home</Link></Button>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: EventForm) => {
    setError(null)
    setPublishing(true)
    
    try {
      // Build FormData for server action
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('date', data.date)
      formData.append('category', data.category)
      if (imageFile) {
        formData.append('imageFile', imageFile)
      }

      const result = await createEventAction(formData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create event.')
      }

      // Invalidate caches so lists refresh
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      queryClient.invalidateQueries({ queryKey: ['all-events'] })
      queryClient.invalidateQueries({ queryKey: ['featured-events'] })

      router.push('/manage-events')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      console.error(err)
      setError(message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-0 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 dark:from-slate-900/80 dark:via-slate-900/50 dark:to-indigo-950/30 border-b border-slate-100 dark:border-slate-800 pb-8">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Create New Event</CardTitle>
          <CardDescription className="text-slate-500">
            Design and publish a new event for your community. It will be live instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Image Upload with Preview */}
            <div className="space-y-2">
              <Label htmlFor="imageFile" className="text-slate-900 dark:text-slate-200 font-semibold">Event Cover Image</Label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <div className="relative w-full aspect-[16/9] bg-slate-100 dark:bg-slate-800">
                    <Image src={imagePreview} alt="Event preview" fill className="object-cover" sizes="600px" />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-400" />
                    Image ready
                  </div>
                </div>
              ) : (
                <label 
                  htmlFor="imageFile" 
                  className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloudIcon className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Click to upload cover image</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG or WebP (recommended 16:9 ratio)</p>
                  </div>
                </label>
              )}
              <Input
                id="imageFile"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-900 dark:text-slate-200 font-semibold">Event Title</Label>
              <Input
                id="title"
                placeholder="E.g. Summer Tech Hackathon 2026"
                className="h-12"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-900 dark:text-slate-200 font-semibold">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                className="h-12"
                {...register('date')}
              />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-900 dark:text-slate-200 font-semibold">Category</Label>
              <select
                id="category"
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                {...register('category')}
              >
                <option value="General">General</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Networking">Networking</option>
                <option value="Social">Social Gathering</option>
                <option value="Hackathon">Hackathon</option>
              </select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900 dark:text-slate-200 font-semibold">Event Description</Label>
              <textarea
                id="description"
                className="flex min-h-[160px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 resize-y"
                placeholder="Describe what attendees can expect. Include speakers, schedule, agenda..."
                {...register('description')}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>

            {/* Validation summary */}
            {Object.keys(errors).length > 0 && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                Please fix the highlighted fields above before publishing.
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 font-medium">
                ⚠️ {error}
              </div>
            )}
            
            <Button type="submit" size="lg" className="w-full text-base h-14 shadow-lg shadow-indigo-500/20 rounded-xl font-semibold" disabled={publishing}>
              {publishing ? (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="w-5 h-5 animate-spin" />
                  Publishing Event...
                </span>
              ) : (
                'Publish Event Now'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
