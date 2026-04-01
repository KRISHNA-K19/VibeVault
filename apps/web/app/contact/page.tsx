'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MailIcon, MessageSquareIcon, SendIcon, UserIcon, MapPinIcon, PhoneIcon, CheckCircle2Icon } from 'lucide-react'
import Image from 'next/image'

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    setError(null)
    setSuccess(false)
    
    // 1. Save to database
    const { error: insertError } = await supabase.from('contacts').insert([
      {
        name: data.name,
        email: data.email,
        message: data.message,
      },
    ])

    if (insertError) {
      setError(insertError.message)
      return
    }

    // 2. Send real-time email notification to admin via Resend
    try {
      const { sendContactEmail } = await import('@/app/actions/email')
      await sendContactEmail(data.name, data.email, data.message)
    } catch (emailErr) {
      console.error('Contact email failed (message was still saved):', emailErr)
    }

    setSuccess(true)
    reset()
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/networking-event.png" alt="Contact us" fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/70 to-slate-50 dark:to-slate-950" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
            Get in Touch
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-300">
            Have questions, want to partner with us, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-3xl shadow-xl text-white space-y-8">
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              
              {[
                { icon: MailIcon, label: 'Email Us', value: 'krishnamoorthyk.cse@gmail.com' },
                { icon: MapPinIcon, label: 'Our HQ', value: '123 Innovation Drive\nTech District, San Francisco' },
                { icon: PhoneIcon, label: 'Call Us', value: '+91 80565 00986' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white/80 text-sm">{item.label}</p>
                    <p className="text-white mt-1 whitespace-pre-line">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Image card */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] hidden lg:block">
              <Image src="/images/workshop-session.png" alt="Our workspace" fill className="object-cover" sizes="400px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <p className="text-white font-semibold text-sm">Our workspace in San Francisco</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-6 px-8 pt-8">
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <MessageSquareIcon className="w-6 h-6 text-indigo-500" />
                  Send a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll be in touch as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {success ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 mb-6">
                      <CheckCircle2Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Message Sent!</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                    <Button variant="outline" onClick={() => setSuccess(false)} className="rounded-full">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-900 dark:text-slate-200 font-semibold">Your Name</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            className="pl-10 h-12"
                            {...register('name')}
                          />
                        </div>
                        {errors.name && <p className="text-sm text-red-500 font-medium">{errors.name.message}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-900 dark:text-slate-200 font-semibold">Your Email</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <MailIcon className="h-5 w-5" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            className="pl-10 h-12"
                            {...register('email')}
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-slate-900 dark:text-slate-200 font-semibold">Message</Label>
                      <Textarea
                        id="message"
                        className="min-h-[150px] resize-y rounded-xl p-4 text-base"
                        placeholder="How can we help you?"
                        {...register('message')}
                      />
                      {errors.message && <p className="text-sm text-red-500 font-medium">{errors.message.message}</p>}
                    </div>

                    {error && (
                      <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 font-medium border border-red-100 dark:border-red-900/50">
                        {error}
                      </div>
                    )}
                    
                    <Button type="submit" size="lg" className="w-full text-base h-14 rounded-xl shadow-lg shadow-indigo-500/20 font-semibold" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending Message...' : (
                        <span className="flex items-center gap-2">
                          Send Message <SendIcon className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
