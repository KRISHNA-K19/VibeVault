'use server'

import { Resend } from 'resend'
import { env } from '@/env.mjs'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

const ADMIN_EMAIL = 'krishnamoorthyk.cse@gmail.com'

export async function sendRSVPEmail(toEmail: string, eventTitle: string, status: 'GOING' | 'NOT_GOING') {
  if (!resend) {
    console.log('No RESEND_API_KEY found, skipping RSVP email')
    return { success: true }
  }

  try {
    const subject = status === 'GOING' ? `RSVP Confirmed: ${eventTitle}` : `RSVP Cancelled: ${eventTitle}`
    const text = status === 'GOING' 
      ? `You have successfully RSVP'd to the event: ${eventTitle}! We look forward to seeing you there.` 
      : `You have cancelled your RSVP for the event: ${eventTitle}.`

    const data = await resend.emails.send({
      from: 'ClubHouse <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      text,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send RSVP email:', error)
    return { success: false, error }
  }
}

export async function sendNewEventEmail(toEmails: string[], eventTitle: string, eventDate: string) {
  if (!resend) {
    console.log('No RESEND_API_KEY found, skipping new event email')
    return { success: true }
  }

  try {
    const data = await resend.emails.send({
      from: 'ClubHouse <onboarding@resend.dev>',
      to: toEmails,
      subject: `New Event: ${eventTitle}`,
      text: `A new event "${eventTitle}" has been organized on ${new Date(eventDate).toLocaleDateString()}. Check it out in the app!`,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send new event email:', error)
    return { success: false, error }
  }
}

export async function sendContactEmail(name: string, email: string, message: string) {
  if (!resend) {
    console.log('No RESEND_API_KEY found, skipping contact email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Send notification to admin
    const data = await resend.emails.send({
      from: 'ClubHouse <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📬 New Contact Message</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">Someone reached out through ClubHouse</p>
          </div>
          <div style="background: #f8fafc; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600; width: 100px;">From</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Email</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a></td>
              </tr>
            </table>
            <div style="margin-top: 24px;">
              <h3 style="color: #334155; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Message</h3>
              <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <a href="mailto:${email}?subject=Re: Your message to ClubHouse" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reply to ${name}</a>
            </div>
          </div>
        </div>
      `,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send contact email:', error)
    return { success: false, error: String(error) }
  }
}
