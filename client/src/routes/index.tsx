import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon, DotIcon, CalendarDaysIcon, Wand2Icon, Share2Icon,
  ZapIcon, BarChart3Icon, HashIcon, CheckCircleIcon, StarIcon,
  CheckIcon, CircleCheckBigIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scheduler — AI Social Media Automation" },
      { name: "description", content: "Create, schedule, and auto-engage across all your social platforms — powered by AI." },
      { property: "og:title", content: "Scheduler — AI Social Media Automation" },
      { property: "og:description", content: "Create, schedule, and auto-engage across all your social platforms — powered by AI." },
    ],
  }),
  component: Landing,
});

function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <span className={`${className} grid place-items-center rounded-lg bg-red-500 text-white`}>
      <ZapIcon className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={() => scrollTo(0, 0)} className="flex items-center gap-2">
          <Logo />
          <span className="text-xl lg:text-2xl font-medium font-serif text-slate-800">Scheduler</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-500">
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
          <a href="#pricing" className="hover:text-slate-900">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block">
            Sign In
          </Link>
          <Link to="/register" className="flex items-center gap-1.5 text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-sm hover:shadow-red-200 hover:shadow-md transition">
            Get Started <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:56px_56px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[560px] bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 text-sm px-3.5 py-1.5 rounded-full mb-8">
          <span className="size-1.5 bg-red-400 rounded-full" />
          AI-Powered Social Media Automation
        </div>

        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl xl:text-8xl text-slate-900">
          Schedule smarter.
          <br />
          <span className="text-red-400 italic">Grow faster.</span>
        </h1>

        <p className="mt-7 text-gray-500 max-w-2xl mx-auto">
          Scheduler lets you create, schedule, and auto-engage across all your social platforms — powered by AI that writes your captions and replies for you.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register" className="bg-red-500 text-white rounded-full font-medium hover:bg-red-600 hover:shadow-[0_8px_24px_rgba(239,68,68,0.35)] inline-flex items-center gap-2 text-[15px] px-8 py-3.5 w-full sm:w-auto justify-center transition-all">
            Start for free <ArrowRightIcon className="size-4" />
          </Link>
          <a href="#how-it-works" className="bg-transparent text-[#333] border-[1.5px] border-black/10 rounded-full font-medium hover:bg-black/5 hover:border-black/20 inline-flex items-center gap-2 text-[15px] px-8 py-3.5 w-full sm:w-auto backdrop-blur justify-center transition-all">
            See how it works
          </a>
        </div>

        <p className="mt-5 text-xs text-gray-400">No credit card required · Free forever plan available</p>
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pb-0">
        <div className="rounded-t-2xl overflow-hidden border border-gray-200 border-b-0">
          <div className="flex items-center gap-2 px-4 py-3 bg-[#f0f0f0] border-b border-black/5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="flex-1 mx-4 rounded-md h-5 max-w-xs bg-white/80" />
          </div>
          <div className="p-6 bg-[#f7f7f7]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { val: "12", label: "Scheduled" },
                { val: "48", label: "Published" },
                { val: "4", label: "Accounts" },
                { val: "3", label: "AI Rules" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-4 bg-white border border-black/5">
                  <div className="text-2xl font-bold text-gray-900 tabular-nums">{s.val}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 space-y-3 bg-white border border-black/5">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Recent Activity</div>
              {[
                { text: "Post published to LinkedIn & Twitter", time: "2m ago" },
                { text: "AI replied to 3 comments", time: "15m ago" },
                { text: "New post scheduled for tomorrow 9am", time: "1h ago" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <DotIcon className="size-5 text-gray-300" />
                  <span className="text-sm text-gray-600 flex-1">{item.text}</span>
                  <span className="text-xs text-gray-300 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: CalendarDaysIcon, title: "Smart Scheduling", description: "Queue posts across all platforms with a single click. Set it once and let us handle the rest." },
  { icon: Wand2Icon, title: "AI Content Generator", description: "Generate on-brand captions and stunning images with our built-in AI. Never stare at a blank page again." },
  { icon: BarChart3Icon, title: "Activity Dashboard", description: "Get a bird's eye view of all published posts, scheduled content, and engagement activity in one place." },
  { icon: Share2Icon, title: "Multi-Platform", description: "Connect Twitter, LinkedIn, Facebook, and Instagram. Post everywhere from one unified workspace." },
  { icon: ZapIcon, title: "Instant Publishing", description: "Need to go live now? Publish immediately or schedule for peak engagement times with full timezone support." },
  { icon: HashIcon, title: "Hashtag Suggestions", description: "Get AI-powered hashtag suggestions to reach a wider audience." },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 text-red-500 text-[11px] font-medium tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
            <ZapIcon className="size-3" /> Everything you need
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-medium leading-tight text-gray-900">
            Automate your entire
            <br />
            <span className="text-red-400 italic">social media workflow</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-xl mx-auto leading-relaxed">
            From content creation to scheduling — Scheduler handles it all so you can focus on what matters most.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-slate-200 hover:shadow-md hover:shadow-slate-100 group">
              <div className="size-10 rounded-xl flex items-center justify-center mb-4 bg-red-50 text-red-500">
                <f.icon className="size-5" />
              </div>
              <h3 className="text-slate-900 mb-2 font-medium">{f.title}</h3>
              <p className="text-sm text-slate-500/90 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { step: "01", title: "Connect Your Accounts", description: "Link your social profiles in seconds. We support Twitter, LinkedIn, Facebook, and Instagram." },
  { step: "02", title: "Create or Generate Content", description: "Write your own post or let our AI craft a caption and image based on your prompt." },
  { step: "03", title: "Schedule & Publish", description: "Pick a time, select your platforms, and hit schedule. We handle publishing automatically." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 text-red-500 text-[11px] font-medium tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
            <CheckCircleIcon className="size-3" /> Simple setup
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-tight text-gray-900">
            Up and running in <span className="text-red-400 italic">minutes</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-lg mx-auto leading-relaxed">
            No complicated onboarding, no steep learning curve. Just connect, create, and grow.
          </p>
        </div>
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={s.step} className="flex gap-6 items-start">
              <div className="shrink-0 size-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                <span className="text-sm font-medium text-red-500">{s.step}</span>
              </div>
              <div className="pt-1">
                <h3 className="text-slate-900 mb-1 font-medium">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden sm:block ml-auto shrink-0 self-center">
                  <ArrowRightIcon className="size-4 text-slate-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Sarah K.", role: "Marketing Manager", avatar: "S", avatarBg: "from-red-400 to-pink-400", text: "Scheduler has saved our team 10+ hours a week. The AI composer is genuinely impressive — it writes content that sounds like us." },
  { name: "Marcus L.", role: "Indie Creator", avatar: "M", avatarBg: "from-violet-400 to-purple-500", text: "I used to dread posting. Now I queue up a whole week of content in 20 minutes. The smart scheduling feature alone is worth it." },
  { name: "Priya D.", role: "Startup Founder", avatar: "P", avatarBg: "from-sky-400 to-blue-500", text: "Finally a scheduler that's beautiful AND powerful. The clean dashboard makes it easy to see exactly what's going out and when." },
];

function Testimonials() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="mb-6 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 text-red-500 text-[11px] font-medium tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
            <StarIcon className="size-3" /> Testimonials
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-tight text-gray-900">
            Loved by <span className="text-red-400">creators &amp; teams</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-md mx-auto">Join thousands of people who automate their social media with Scheduler.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 p-6 transition-all flex flex-col gap-4">
              <p className="text-slate-600 text-sm leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className={`size-9 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>{t.avatar}</div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const pricingPlans = [
  { name: "Starter", price: "Free", period: "", description: "Perfect for creators just getting started with social media automation.", features: ["2 social accounts", "10 scheduled posts/month", "AI content (5 credits/mo)", "Basic dashboard"], cta: "Get Started Free", highlight: false },
  { name: "Pro", price: "$29", period: "/month", description: "Everything you need to grow and automate your social presence.", features: ["Unlimited accounts", "Unlimited scheduling", "AI content (200 credits/mo)", "Priority support"], cta: "Start 14-day Free Trial", highlight: true },
  { name: "Agency", price: "$79", period: "/month", description: "For teams and agencies managing multiple brands at scale.", features: ["Everything in Pro", "5 team members", "Unlimited AI credits", "Custom AI personas", "Dedicated support"], cta: "Contact Sales", highlight: false },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 text-red-500 text-[11px] font-medium tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
            <CircleCheckBigIcon className="size-3" /> Simple pricing
          </div>
          <h2 className="font-serif font-medium text-4xl sm:text-5xl leading-tight text-gray-900">
            Plans for every stage
            <br />
            <span className="text-red-400 italic">of growth</span>
          </h2>
          <p className="mt-5 text-gray-500 max-w-md mx-auto">Start free, upgrade when you're ready. Cancel anytime — no hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {pricingPlans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl border p-7 flex flex-col gap-6 relative ${plan.highlight ? "bg-red-500 text-white border-red-400 shadow-2xl shadow-red-100" : "bg-white text-slate-900 border-slate-200"}`}>
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div>
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-red-100" : "text-red-500"}`}>{plan.name}</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm mb-1.5 ${plan.highlight ? "text-red-200" : "text-slate-400"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 leading-relaxed ${plan.highlight ? "text-red-100" : "text-slate-500"}`}>{plan.description}</p>
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className={`size-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? "bg-red-400" : "bg-red-50"}`}>
                      <CheckIcon className={`w-2.5 h-2.5 ${plan.highlight ? "text-white" : "text-red-500"}`} />
                    </div>
                    <span className={plan.highlight ? "text-red-50" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`mt-auto text-center font-semibold text-sm px-6 py-3 rounded-full transition ${plan.highlight ? "bg-white text-red-500 hover:bg-red-50" : "bg-red-500 text-white hover:bg-red-600"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="relative rounded-3xl overflow-hidden p-14 sm:p-20 text-center border-[1.5px] border-red-500/10" style={{ background: "linear-gradient(145deg, #fff5f5 0%, #fef2f2 100%)" }}>
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)" }} />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/15 text-red-500 text-[11px] font-medium tracking-[0.06em] uppercase px-3.5 py-1.5 rounded-full">
              Ready to grow?
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-tight font-medium text-gray-900">
              Automate your social
              <br />
              <span className="text-red-400 italic">media today</span>
            </h2>
            <p className="mt-6 text-gray-500 max-w-lg mx-auto text-lg">
              Join thousands of creators and marketers who trust Scheduler to grow their audience on autopilot.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 hover:shadow-[0_8px_24px_rgba(239,68,68,0.35)] inline-flex items-center gap-2 text-[15px] px-10 py-4 w-full sm:w-auto justify-center transition">
                Get Started Free <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const footerLinks = {
  Product: ["Features", "How it works", "Pricing", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

function Footer() {
  return (
    <footer className="bg-[#fafafa] border-t border-black/[0.07]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <Link to="/" onClick={() => scrollTo(0, 0)} className="inline-flex items-center gap-2 mb-5">
              <Logo className="size-6" />
              <span className="font-medium font-serif text-xl text-gray-800">Scheduler</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              The AI-powered social media scheduler that helps creators and teams grow faster with less effort.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-5 text-gray-600">{category}</div>
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-black/[0.07]">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Scheduler. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-700">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-700">Terms of Service</a>
            <Link to="/login" className="text-xs text-gray-400 hover:text-gray-700">Sign In</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}