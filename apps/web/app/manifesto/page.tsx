import Image from "next/image"
import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Manifesto | ClubHouse",
  description: "Read our guiding principles and vision for building the future of community.",
}

export default function ManifestoPage() {
  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/conference-stage.png"
            alt="Conference keynote"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/85 to-slate-50 dark:to-slate-950" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-44 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            The Manifesto
          </h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-indigo-400 to-cyan-400 mx-auto rounded-full mb-8" />
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Our guiding principles for building meaningful communities in a disconnected world.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <article className="space-y-16">
          
          <section className="flex gap-8 items-start">
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 items-center justify-center text-2xl font-extrabold">
              I
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">The Need for Proximity</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                In an increasingly digital world, isolation has become an architectural design flaw of modern society. 
                We believe that the atomic unit of a thriving civilization is not the individual behind a screen, but the 
                gathering of minds in a shared space. We build events because <strong className="text-slate-900 dark:text-slate-200">presence is irreplaceable</strong>.
              </p>
            </div>
          </section>

          <div className="relative rounded-3xl overflow-hidden">
            <Image src="/images/workshop-session.png" alt="Collaborative workshop" width={1200} height={500} className="object-cover w-full h-[300px] md:h-[400px] rounded-3xl" />
          </div>

          <section className="flex gap-8 items-start">
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 items-center justify-center text-2xl font-extrabold">
              II
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">Radical Openness</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                Knowledge silos are the enemy of innovation. Our community fundamentally rejects gatekeeping. 
                We welcome the curious, the relentless, and the optimists. Whether you are a student writing your first line 
                of code, or a seasoned builder constructing the future, <strong className="text-slate-900 dark:text-slate-200">your perspective is vital</strong>.
              </p>
            </div>
          </section>

          <section className="bg-gradient-to-br from-slate-900 to-indigo-950 p-10 md:p-14 rounded-3xl border border-slate-800 relative overflow-hidden">
            <div className="relative z-10 flex gap-8 items-start">
              <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-white/10 text-white items-center justify-center text-2xl font-extrabold">
                III
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Growth over Comfort</h2>
                <blockquote className="text-xl italic text-indigo-300 mb-6 leading-relaxed">
                  "Magic happens exactly at the boundary of your comfort zone."
                </blockquote>
                <p className="text-lg text-slate-300 leading-relaxed">
                  We design our interactions and workshops to deliberately challenge conventions. Safety is guaranteed, but intellectual comfort is not.
                  We debate, we iterate, and we elevate one another relentlessly.
                </p>
              </div>
            </div>
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          </section>

          <div className="relative rounded-3xl overflow-hidden">
            <Image src="/images/hackathon-event.png" alt="Hackathon in progress" width={1200} height={500} className="object-cover w-full h-[300px] md:h-[400px] rounded-3xl" />
          </div>

          <section className="flex gap-8 items-start">
            <div className="hidden md:flex shrink-0 w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 items-center justify-center text-2xl font-extrabold">
              IV
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">The Long Term</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                We are not playing finite games. We are building an infrastructure of trust and collaboration intended to outlast its founders.
                The connections forged at our events today will architect the monumental companies, art, and movements of tomorrow.
              </p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">
                Join us. Let's build what comes next.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center pt-8">
            <Button size="lg" asChild className="h-14 px-8 rounded-full shadow-lg shadow-indigo-500/20 text-base font-semibold">
              <Link href="/events">
                Discover Our Events
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  )
}
