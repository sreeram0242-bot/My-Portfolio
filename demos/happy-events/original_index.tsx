import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu,
  X,
  Calendar,
  Play,
  Heart,
  MessageSquare,
  Wine,
  MapPin,
  Users,
  Award,
  Handshake,
  CalendarDays,
  Headphones,
  ArrowRight,
  Mail,
  Phone,
  Instagram,
  Facebook,
  HeartHandshake,
  Briefcase,
  Sparkles,
  Globe,
} from "lucide-react";
import heroWedding from "@/assets/hero-wedding.png";
import promiseTent from "@/assets/promise-tent.jpg";
import catBirthday from "@/assets/cat-birthday.jpg";
import catMarriage from "@/assets/cat-marriage.jpg";
import catCollege from "@/assets/cat-college.jpg";
import catSchool from "@/assets/south-indian-school.png";
import catDj from "@/assets/cat-dj.jpg";
import catCatering from "@/assets/cat-catering.jpg";
import catBridal from "@/assets/cat-bridal.jpg";
import catPhotography from "@/assets/cat-photography.png";
import logo from "@/assets/logo.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PlanEventDialog } from "@/components/PlanEventDialog";
import { SlideToPlanButton } from "@/components/SlideToPlanButton";

export const Route = createFileRoute("/")({
  component: Index,
});

const services = [
  { icon: Heart, label: "Weddings" },
  { icon: Users, label: "College\nEvents" },
  { icon: Wine, label: "Birthdays" },
  { icon: Award, label: "All\nCelebrations" },
];

const packages = [
  { tier: "Essential", price: "₹10K+", desc: "Intimate gatherings & birthdays" },
  { tier: "Signature", price: "₹20K+", desc: "College fests & mid-size events" },
  { tier: "Grand", price: "Custom", desc: "Weddings & large celebrations" },
];

const whyUs = [
  "Owner-led personal accountability",
  "Food & Decoration as core strengths",
  "Flexible, scalable per-event model",
  "Trusted vendor & specialist network",
];

const stats = [
  { icon: Users, value: "150+", label: "Happy Clients" },
  { icon: Award, value: "10+", label: "Years Experience" },
  { icon: Handshake, value: "100%", label: "Client Satisfaction" },
  { icon: CalendarDays, value: "On-Time", label: "Delivery" },
];

const gallery = [
  { img: catBirthday, label: "Birthday Party" },
  { img: catMarriage, label: "Marriage" },
  { img: catCollege, label: "College Events" },
  { img: catSchool, label: "School Events" },
  { img: catDj, label: "DJ Party" },
  { img: catCatering, label: "Catering" },
  { img: catBridal, label: "Bridal" },
  { img: catPhotography, label: "Photography" },
];

const detailedServices = [
  {
    title: "Social & Family Milestone Events",
    icon: HeartHandshake,
    items: [
      "Premium Catering Services",
      "Weddings & Pre-Wedding Ceremonies (Haldi, Mehendi, Sangeet, Reception)",
      "Engagements & Roka Ceremonies",
      "Anniversary Galas & Re-Wedding Rituals (Shashti Poorthi / 60th Birthdays)",
      "Milestone Birthday Parties (1st birthdays, Sweet 16, Silver Jubilees)",
      "Baby Showers & Traditional Functions (Godh Bharai / Seemantham)",
      "Newborn Naming Ceremonies (Namakarana)",
      "Childhood Milestone Events (Mundan / Head Shaving Ceremonies)",
      "Coming-of-Age & Thread Ceremonies (Upanayana / Janeu / Half-Saree Functions)"
    ]
  },
  {
    title: "Corporate & Business Events",
    icon: Briefcase,
    items: [
      "Grand Launch & Inauguration Ceremonies (Office, Store, or Showroom)",
      "Auspicious Muhurat & Pooja Events (Bhoomi Pooja, Griha Pravesh)",
      "Corporate Festival Celebrations (Diwali Parties, Eid Luncheons, Christmas)",
      "Annual Award Functions & Gala Nights",
      "Corporate Team Building & Offsite Meets",
      "Product Launches & Press Conferences",
      "Exhibitions, Trade Fairs, and Business Expos"
    ]
  },
  {
    title: "Seasonal & Cultural Festival Events",
    icon: Sparkles,
    items: [
      "Diwali & Dussehra Grand Galas (Card Parties, Pandal Management, Society)",
      "Holi Rain Dance & Color Parties",
      "Navratri Garba & Dandiya Nights",
      "Ganesh Chaturthi & Durga Puja Mandap Management",
      "Eid Milans & Community Feasts",
      "Christmas Eve Parties & New Year Bashes",
      "Harvest Festival Celebrations (Pongal, Onam Sadya, Baisakhi, Lohri Events)"
    ]
  },
  {
    title: "Large-Scale Public & Community Events",
    icon: Globe,
    items: [
      "Cultural Music & Dance Concerts",
      "Community Melas, Flea Markets, & Food Festivals",
      "Fashion Shows & Pageants",
      "College Fests & Talent Showcases",
      "Charity Galas & Fundraising Events",
      "Marathons, Sports Days, & Fitness Events"
    ]
  }
];


function GoldDivider() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px w-16 bg-brand-gold" />
      <span className="text-brand-gold text-xs">◆</span>
      <span className="h-px w-16 bg-brand-gold" />
    </div>
  );
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-foreground">
      {/* HERO */}
      <section className="relative bg-brand-cream">
        <div className="relative min-h-[280px] overflow-hidden bg-brand-green-deep text-brand-cream sm:h-[clamp(380px,48vh,430px)] md:h-[55vh] lg:h-[65vh]">
          {/* Image banner */}
          <div className="pointer-events-none absolute inset-0">
            <img
              src={heroWedding}
              alt="Elegant wedding setup"
              className="h-full w-full object-cover translate-x-[2cm] scale-110"
              width={1200}
              height={1600}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-green-deep via-brand-green-deep/80 to-transparent md:via-brand-green-deep/70" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-green-deep to-transparent" />
          </div>

          {/* Nav */}
          <header className="relative z-20 flex items-start justify-between px-5 pt-4 sm:pt-5 md:px-12 lg:px-24 md:pt-6 md:max-w-7xl md:mx-auto">
            <div className="flex items-center gap-2 md:-translate-x-[2cm]">
              <img src={logo} alt="Happy Events" className="h-12 w-auto drop-shadow sm:h-16 md:h-20" />
              <span className="font-display text-brand-gold whitespace-nowrap text-lg sm:text-xl md:text-3xl mt-1">Happy Events</span>
            </div>

            {/* Desktop Tabs */}
            <nav className="hidden md:flex items-center gap-8 lg:gap-12 pt-2 md:pt-4 md:-translate-y-[1cm] md:translate-x-[3cm]">
              <a href="#" className="font-display text-brand-cream hover:text-brand-gold text-sm lg:text-base tracking-wider transition-colors">HOME</a>
              <a href="#services" className="font-display text-brand-cream hover:text-brand-gold text-sm lg:text-base tracking-wider transition-colors">SERVICES</a>
              <a href="#about" className="font-display text-brand-cream hover:text-brand-gold text-sm lg:text-base tracking-wider transition-colors">ABOUT</a>
              <a href="#gallery" className="font-display text-brand-cream hover:text-brand-gold text-sm lg:text-base tracking-wider transition-colors">GALLERY</a>
              <a href="#plan-event" className="font-display text-brand-cream hover:text-brand-gold text-sm lg:text-base tracking-wider transition-colors">CONTACT</a>
            </nav>

            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="md:hidden rounded-md p-2 text-brand-cream/90 hover:text-brand-gold"
            >
              <Menu className="h-7 w-7" strokeWidth={1.5} />
            </button>
          </header>

          {/* Hero content */}
          <div className="relative px-5 pt-4 pb-4 z-10 sm:absolute sm:px-0 sm:pt-0 sm:pb-0 sm:left-5 sm:right-5 sm:top-[5.75rem] md:left-1/2 md:top-[60%] lg:top-[55%] md:-translate-x-1/2 md:-translate-y-1/2 md:flex md:w-full md:max-w-4xl md:flex-col md:items-center md:text-center md:px-4">
            <h1 className="font-display text-[1.72rem] leading-[1.03] tracking-tight min-[380px]:text-[1.92rem] sm:text-[2.45rem] md:text-[3.5rem] lg:text-[4.5rem]">
              <span className="block font-normal text-brand-cream">You Dream It</span>
              <span className="block font-normal text-brand-gold md:mt-2">We Plan It</span>
            </h1>

            <div className="mt-2 sm:mt-4 md:mt-8 md:flex md:justify-center w-full"><GoldDivider /></div>

            <div className="mt-4 flex flex-col items-start gap-4 md:mt-8 md:items-center md:gap-6">
              <p className="max-w-[18rem] text-[12px] leading-relaxed text-brand-cream/90 sm:max-w-sm sm:text-[14px] md:max-w-lg md:text-base lg:text-lg">
                From elegant celebrations to grand corporate events — we bring your vision to life.
              </p>
              <SlideToPlanButton className="sm:ml-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Services icons - joined to header */}
      <div className="w-full lg:bg-[url('data:image/svg+xml,%3Csvg%20width=%2224%22%20height=%2224%22%20viewBox=%220%200%2024%2024%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ccircle%20cx=%222%22%20cy=%222%22%20r=%222%22%20fill=%22%23C9A227%22%20fill-opacity=%220.6%22/%3E%3C/svg%3E')]">
        <section className="-mt-px relative z-20">
          <div className="gold-shine grid grid-cols-4 gap-0 bg-brand-gold px-0 py-0.5 md:py-4 md:max-w-3xl md:mx-auto md:rounded-b-2xl md:shadow-lg">
            {services.map(({ icon: Icon, label }) => {
              let mappedEvent = "Other";
              if (label.includes("Weddings")) mappedEvent = "Wedding";
              if (label.includes("Birthdays")) mappedEvent = "Birthday";
              if (label.includes("College")) mappedEvent = "College Fest";
              
              return (
                <PlanEventDialog key={label} defaultEventType={mappedEvent}>
                  <button className="flex flex-col items-center justify-center gap-0.5 px-1 py-1 text-center md:gap-2 hover:scale-110 transition-transform duration-300 outline-none rounded-lg">
                    <Icon className="h-2 w-2 text-brand-green-deep md:h-6 md:w-6" strokeWidth={2} />
                    <span className="whitespace-pre-line text-[6px] font-semibold uppercase tracking-wider text-brand-green-deep leading-[1.05] md:text-[10px] lg:text-xs">
                      {label}
                    </span>
                  </button>
                </PlanEventDialog>
              );
            })}
          </div>
        </section>

        <div className="md:max-w-5xl md:mx-auto md:px-8 lg:bg-brand-cream lg:px-12 lg:pb-12 lg:pt-8 lg:shadow-[0_4px_40px_rgba(0,0,0,0.02)]">
          {/* GALLERY CAROUSEL */}
          <section id="gallery" className="px-4 pt-6 md:pt-12 pb-4 scroll-mt-16">
            <div className="mb-3 text-center md:mb-8">
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-brand-gold md:text-xs">
                ✦ Our Service ✦
              </p>
              <h2 className="mt-1 font-display text-lg text-brand-green-deep md:text-3xl">
                Moments We've Crafted
              </h2>
            </div>
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {gallery.map((g) => (
                  <CarouselItem key={g.label} className="basis-4/5 pl-2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 md:pl-4">
                    <div className="group relative overflow-hidden rounded-2xl shadow-md cursor-pointer">
                      <img
                        src={g.img}
                        alt={g.label}
                        loading="lazy"
                        width={1200}
                        height={800}
                        className="h-48 w-full object-cover transition duration-500 group-hover:scale-110 md:h-64"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-green-deep/95 via-brand-green-deep/40 to-transparent px-3 py-2 md:px-4 md:py-3">
                        <p className="font-display text-sm text-brand-cream md:text-lg translate-y-1 group-hover:translate-y-0 transition duration-300">{g.label}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-1 h-8 w-8 border-brand-gold/60 bg-brand-cream text-brand-green-deep md:-left-5 md:h-10 md:w-10 hover:bg-brand-gold hover:text-white" />
              <CarouselNext className="right-1 h-8 w-8 border-brand-gold/60 bg-brand-cream text-brand-green-deep md:-right-5 md:h-10 md:w-10 hover:bg-brand-gold hover:text-white" />
            </Carousel>
          </section>

          {/* STATS */}
          <section className="px-4 md:py-4">
            <div className="rounded-2xl bg-brand-green-deep px-2 py-3 md:py-5 md:px-6 text-brand-cream shadow-lg">
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {stats.map(({ icon: Icon, value, label }, i) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center gap-1 md:gap-2 px-1 text-center ${i < stats.length - 1 ? "border-r border-brand-cream/15 md:border-r-2" : ""
                      }`}
                  >
                    <Icon className="h-4 w-4 md:h-6 md:w-6 text-brand-gold" strokeWidth={1.5} />
                    <div className="font-display text-sm md:text-2xl leading-none">{value}</div>
                    <div className="text-[8px] md:text-xs leading-tight tracking-wide text-brand-cream/80 uppercase">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* DETAILED SERVICES */}
          <section id="detailed-services" className="px-4 pt-8 md:pt-12 scroll-mt-16">
            <div className="text-center md:mb-10 mb-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-brand-gold md:text-xs">
                ✦ What We Do ✦
              </p>
              <h2 className="mt-2 font-display text-xl leading-tight text-brand-green-deep md:text-4xl md:mt-3">
                Our Expertise Across All Events
              </h2>
            </div>
            <Carousel opts={{ align: "start", loop: false }} className="w-full md:max-w-5xl md:mx-auto">
              <CarouselContent className="-ml-4">
                {detailedServices.map((cat, index) => (
                  <CarouselItem key={index} className="basis-[90%] pl-4 sm:basis-1/2 lg:basis-1/2">
                    <div className="h-full rounded-2xl border border-brand-gold/30 bg-white p-5 md:p-8 shadow-sm transition-shadow hover:shadow-md group">
                      <div className="flex items-center gap-3 mb-4 md:mb-6 border-b border-brand-gold/20 pb-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-green-deep/5 text-brand-green-deep group-hover:bg-brand-gold/10 transition-colors md:h-12 md:w-12">
                          <cat.icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                        </span>
                        <h3 className="font-display text-base md:text-xl text-brand-green-deep font-semibold">
                          {cat.title}
                        </h3>
                      </div>
                      <ul className="space-y-2 md:space-y-3">
                        {cat.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] md:text-sm text-brand-charcoal leading-relaxed">
                            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold/80" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12 h-10 w-10 border-brand-gold/60 bg-brand-cream text-brand-green-deep hover:bg-brand-gold hover:text-white" />
              <CarouselNext className="hidden md:flex -right-12 h-10 w-10 border-brand-gold/60 bg-brand-cream text-brand-green-deep hover:bg-brand-gold hover:text-white" />
            </Carousel>
          </section>

          {/* ABOUT & PACKAGES (Side by side on desktop) */}
          <div className="md:flex md:gap-12 md:pt-12 md:pb-8">
            {/* ABOUT */}
            <section id="about" className="px-4 pt-6 text-center md:text-left md:pt-0 md:flex-1 scroll-mt-16 flex flex-col justify-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-brand-gold md:text-xs">
                ✦ About Us ✦
              </p>
              <h2 className="mt-2 font-display text-xl leading-tight text-brand-green-deep md:text-3xl md:mt-3">
                Led by Vijay. <br className="hidden md:block" /> Powered by Passion.
              </h2>
              <p className="mx-auto mt-3 max-w-sm md:mx-0 md:max-w-none text-[11px] md:text-sm leading-relaxed text-brand-charcoal md:mt-5">
                Happy Events is an owner-run event management service crafting weddings,
                college fests, birthdays and celebrations of every scale — with{" "}
                <span className="font-semibold text-brand-green-deep">Food & Decoration</span>{" "}
                as our signature pillars.
              </p>
            </section>

            {/* PACKAGES */}
            <section className="px-4 pt-6 md:pt-0 md:flex-[1.5]">
              <div className="mb-3 text-center md:text-left md:mb-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-brand-gold md:text-xs">
                  ✦ Our Packages ✦
                </p>
                <h2 className="mt-1 font-display text-lg text-brand-green-deep md:text-2xl">
                  Tailored For Every Budget
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {packages.map((p) => (
                  <div
                    key={p.tier}
                    className="rounded-xl border border-brand-gold/40 bg-white p-2.5 md:p-5 text-center shadow-sm transition hover:shadow-md hover:border-brand-gold"
                  >
                    <div className="font-display text-[11px] text-brand-green-deep md:text-base">{p.tier}</div>
                    <div className="mt-1 font-display text-sm text-brand-gold md:text-xl md:mt-2">{p.price}</div>
                    <div className="mt-1 text-[8px] md:text-[11px] leading-tight text-brand-charcoal md:mt-2">{p.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SPECIAL OFFER */}
          <section className="px-4 pt-6 md:pt-10">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-gold/30 via-white to-brand-cream p-6 md:p-8 border border-brand-gold/40 shadow-sm hover:shadow-md transition md:max-w-4xl md:mx-auto text-center">
              <div className="flex justify-center mb-3">
                <span className="inline-block bg-brand-gold text-brand-green-deep px-3 py-1 rounded-full text-[9px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
                  Exclusive Offer
                </span>
              </div>
              <h3 className="font-display text-lg md:text-3xl text-brand-green-deep">
                Free DJ & Ice Creams!
              </h3>
              <p className="mt-2 text-[11px] md:text-base text-brand-charcoal max-w-xl mx-auto leading-relaxed">
                Book Happy Events for your <strong className="text-brand-green-deep">marriage events</strong> and enjoy complimentary DJ services along with a delightful ice cream stall for all your guests!
              </p>
              <p className="mt-3 md:mt-4 text-[9px] md:text-[11px] text-brand-charcoal/60 italic">
                *Terms and conditions apply. Subject to package selection and minimum guest requirements.
              </p>
            </div>
          </section>

          {/* WHY CHOOSE US */}
          <section className="px-4 pt-6 md:pt-10">
            <div className="rounded-2xl bg-white p-4 md:p-10 shadow-md md:max-w-4xl md:mx-auto">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-brand-gold md:text-xs">
                  ✦ Why Choose Us ✦
                </p>
                <h2 className="mt-1 font-display text-lg text-brand-green-deep md:text-3xl md:mt-3">
                  Built On Trust & Detail
                </h2>
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-2 md:mt-8 md:grid-cols-2 md:gap-6">
                {whyUs.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-brand-charcoal md:text-base bg-brand-cream/30 p-2 md:p-4 rounded-lg">
                    <span className="mt-0.5 md:mt-0 grid h-4 w-4 md:h-6 md:w-6 shrink-0 place-items-center rounded-full bg-brand-gold/20 text-brand-gold text-[9px] md:text-sm">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>



          {/* CTA CARD */}
          <section id="plan-event" className="px-4 pt-4 pb-8 md:pt-10 md:pb-20 scroll-mt-16 md:max-w-4xl md:mx-auto">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-4 shadow-md md:px-8 md:py-10 md:flex-row md:justify-between border-t-4 border-brand-gold">
              <div className="flex items-center gap-3 md:gap-6 flex-1">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand-gold/60 md:h-16 md:w-16 bg-brand-cream/50">
                  <Headphones className="h-5 w-5 text-brand-gold md:h-8 md:w-8" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm leading-snug text-brand-green-deep md:text-2xl">
                    Let's Make Your Next Event Unforgettable
                  </h3>
                  <p className="mt-0.5 text-[10px] text-brand-charcoal md:text-sm md:mt-2">
                    Get in touch with our experts today.
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/919626610819?text=Hi%20Happy%20Events%2C%20I%27d%20like%20to%20get%20a%20quote%20for%20my%20event."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-gold px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-brand-green-deep shadow md:px-6 md:py-3 md:text-xs hover:brightness-110 hover:scale-105 transition"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 md:h-5 md:w-5" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.15-.174.2-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
                Message Now
              </a>
            </div>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-brand-green-deep px-6 py-10 md:py-16 text-brand-cream border-t border-brand-gold/20">
        <div className="md:max-w-5xl md:mx-auto md:flex md:justify-between md:items-start">
          <div className="md:max-w-sm">
            <img src={logo} alt="Happy Events" className="h-24 md:h-28 w-auto" />
            <p className="mt-4 max-w-xs md:max-w-full text-sm md:text-sm text-brand-cream/80 leading-relaxed">
              Crafting unforgettable experiences with elegance, precision and heart. Let us make your next event a beautiful memory.
            </p>
          </div>

          <div className="mt-8 md:mt-0 md:text-right">
            <h4 className="font-display text-lg text-brand-gold mb-4 hidden md:block">Contact Us</h4>
            <div className="space-y-3 md:space-y-3 text-sm md:text-sm">
              <a href="mailto:happyeventskarur@gmail.com" className="flex items-center md:justify-end gap-3 text-brand-cream/90 hover:text-brand-gold transition">
                <Mail className="h-4 w-4 text-brand-gold" /> happyeventskarur@gmail.com
              </a>
              <div className="flex flex-wrap items-center md:justify-end gap-3">
                <a href="tel:+919626610819" className="flex items-center gap-3 text-brand-cream/90 hover:text-brand-gold transition">
                  <Phone className="h-4 w-4 text-brand-gold" /> +91 96266 10819
                </a>
                <a
                  href="tel:+919626610819"
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-3 py-1.5 md:px-4 md:py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-brand-green-deep shadow hover:brightness-110 md:ml-2"
                >
                  <Phone className="h-3 w-3" strokeWidth={2.5} />
                  Call Now
                </a>
              </div>
            </div>

            <div className="mt-6 md:mt-6 flex md:justify-end gap-3">
              <a href="https://www.instagram.com/happy_event_karur?igsh=MXZndDFtdzNpNjFheg==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-10 w-10 md:h-10 md:w-10 place-items-center rounded-full border border-brand-cream/30 bg-brand-cream/5 hover:bg-brand-gold hover:border-brand-gold hover:text-brand-green-deep transition text-brand-cream">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.facebook.com/share/1bm3wQoYzN/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-10 w-10 md:h-10 md:w-10 place-items-center rounded-full border border-brand-cream/30 bg-brand-cream/5 hover:bg-brand-gold hover:border-brand-gold hover:text-brand-green-deep transition text-brand-cream">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="md:max-w-5xl md:mx-auto">
          <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] md:text-xs text-brand-cream/50 pt-4 md:border-t md:border-brand-cream/10">
            <p>
              © {new Date().getFullYear()} Happy Events. All rights reserved.
            </p>
            <p>
              Made with <a href="https://c-entrepreneurs.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors underline decoration-brand-cream/30 hover:decoration-brand-gold">c-entrepreneurs</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile side drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer panel */}
        <aside
          className={`absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-brand-green-deep text-brand-cream shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Gold accent edge */}
          <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-brand-gold via-brand-gold/60 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-cream/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Happy Events" className="h-10 w-auto" />
              <span className="font-display text-brand-gold text-base">Happy Events</span>
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-brand-cream/20 text-brand-cream/90 transition hover:border-brand-gold hover:text-brand-gold"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
            {[
              { label: "Home", target: "#top" },
              { label: "Services", target: "#services" },
              { label: "About", target: "#about" },
              { label: "Gallery", target: "#gallery" },
              { label: "Contact", target: "#plan-event" },
            ].map(({ label, target }, i) => (
              <a
                key={label}
                href={target}
                onClick={() => setMenuOpen(false)}
                className="group flex items-center justify-between rounded-xl px-4 py-3 font-display text-lg text-brand-cream/90 transition hover:bg-brand-cream/5 hover:text-brand-gold"
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 text-[10px] font-sans tracking-widest text-brand-gold/70">
                    0{i + 1}
                  </span>
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
              </a>
            ))}
          </nav>

          {/* Footer CTA */}
          <div className="border-t border-brand-cream/10 px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-brand-gold">Get in touch</p>
            <a
              href="tel:+919626610819"
              className="mt-2 flex items-center gap-2 text-sm text-brand-cream/90 hover:text-brand-gold"
            >
              <Phone className="h-4 w-4 text-brand-gold" /> +91 96266 10819
            </a>
            <a
              href="mailto:happyeventskarur@gmail.com"
              className="mt-1 flex items-center gap-2 text-sm text-brand-cream/90 hover:text-brand-gold"
            >
              <Mail className="h-4 w-4 text-brand-gold" /> happyeventskarur@gmail.com
            </a>
            <div className="mt-4 flex gap-2">
              <a
                href="https://www.instagram.com/happy_event_karur?igsh=MXZndDFtdzNpNjFheg=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-brand-cream/25 hover:border-brand-gold hover:text-brand-gold"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/share/1bm3wQoYzN/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full border border-brand-cream/25 hover:border-brand-gold hover:text-brand-gold"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
