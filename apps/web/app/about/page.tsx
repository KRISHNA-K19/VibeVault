import { CameraIcon, TargetIcon, UsersIcon, HeartIcon, CodeIcon, GlobeIcon, TrendingUpIcon, AwardIcon } from "lucide-react"
import Image from "next/image"

export const metadata = {
  title: "About Us | ClubHouse",
  description: "Learn about our vision, mission, and the team behind ClubHouse.",
}

export default function AboutPage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section with Image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/networking-event.png"
            alt="ClubHouse networking event"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-slate-900/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              More Than Just
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">A Network</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
              We are a dynamic organization of creators, innovators, and leaders. We build bridges between ideas and reality through immersive offline and online experiences.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: TargetIcon,
              title: 'Our Mission',
              desc: 'To empower individuals by curating high-signal events that foster genuine connections, intellectual growth, and collaborative serendipity.',
              color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
            },
            {
              icon: UsersIcon,
              title: 'Our Community',
              desc: 'A diverse ecosystem of self-starters and domain experts. From weekend hackathons to deep-dive seminars, everyone brings something unique to the table.',
              color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
            },
            {
              icon: CameraIcon,
              title: 'Our Events',
              desc: 'Carefully crafted experiences. We believe that physical gatherings remain the ultimate catalyst for human progress and technological innovation.',
              color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
            },
          ].map((card) => (
            <div key={card.title} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-800/50 hover:shadow-lg transition-shadow duration-300">
              <div className={`w-14 h-14 flex items-center justify-center rounded-2xl ${card.color} mb-6`}>
                <card.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">{card.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="bg-slate-900 dark:bg-slate-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">Our Impact in Numbers</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Since 2024, we've been steadily growing our community footprint across the globe.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUpIcon, value: '50+', label: 'Events Organized', color: 'text-indigo-400' },
              { icon: UsersIcon, value: '500+', label: 'Active Members', color: 'text-emerald-400' },
              { icon: GlobeIcon, value: '10+', label: 'Cities Worldwide', color: 'text-cyan-400' },
              { icon: AwardIcon, value: '15+', label: 'Awards Won', color: 'text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-8 rounded-3xl bg-slate-800/50 ring-1 ring-slate-700/50">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-4`} />
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-4">What We Believe</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Our core values define how we create, connect, and grow.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { icon: HeartIcon, title: 'Community First', desc: "Every decision starts with one question: does this serve our community? If not, we don\u2019t do it.", color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
            { icon: CodeIcon, title: 'Builders Mindset', desc: "We don\u2019t just talk about ideas — we prototype, iterate, and ship. That\u2019s the standard we hold ourselves to.", color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10' },
            { icon: GlobeIcon, title: 'Open by Default', desc: 'Knowledge silos are the enemy. We share openly, learn publicly, and welcome everyone to the table.', color: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10' },
            { icon: TrendingUpIcon, title: 'Growth Obsessed', desc: 'Comfort zones are for coasting. We design experiences that challenge, stretch, and ultimately elevate our members.', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
          ].map((v) => (
            <div key={v.title} className="flex gap-5 p-6 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/50 dark:ring-slate-800/50 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 flex items-center justify-center rounded-2xl shrink-0 ${v.color}`}>
                <v.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{v.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section with Image */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/about-team.png"
              alt="ClubHouse organizing team"
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50" />
          </div>
          <div className="relative z-10 p-10 md:p-20">
            <div className="md:w-2/3">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-6">Meet the Organizing Team</h2>
              <p className="text-lg text-slate-300 leading-relaxed mb-8">
                A decentralized group of volunteers passionate about driving community engagement and curating memorable experiences. What started as a small coffee meetup has evolved into a global movement spanning multiple cities and thousands of passionate builders.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Engineering', 'Design', 'Marketing', 'Operations', 'Community'].map((role) => (
                  <span key={role} className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/10">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
