/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Car, ChevronRight, MessageSquare, Utensils } from 'lucide-react';

type Service = 'home' | 'restaurant' | 'car_rental';

interface LandingPageProps {
  onSelectService: (service: Service) => void;
}

const SERVICE_CARDS = [
  {
    id: 'restaurant' as const,
    title: 'Restaurant Portal',
    heading: 'Food portal',
    description:
      'Browse the menu, add dishes to your basket, and place your order directly on WhatsApp.',
    contact: 'Restaurant WhatsApp: 0541292381',
    accentClasses:
      'border-red-500/25 bg-gradient-to-br from-red-500/16 via-red-500/8 to-white/4 hover:border-red-400/50 hover:shadow-red-500/20',
    iconWrapClasses: 'border-red-400/30 bg-red-500/15 text-red-300',
    ctaClasses: 'text-red-200',
    icon: Utensils,
  },
  {
    id: 'car_rental' as const,
    title: 'Car Rental Portal',
    heading: 'Transport portal',
    description:
      'Choose from the available fleet and chat with the transport team on WhatsApp for quick booking.',
    contact: 'Rental WhatsApp: 0555029441',
    accentClasses:
      'border-amber-500/25 bg-gradient-to-br from-amber-500/16 via-amber-500/8 to-white/4 hover:border-amber-300/50 hover:shadow-amber-500/20',
    iconWrapClasses: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
    ctaClasses: 'text-amber-100',
    icon: Car,
  },
] as const;

export default function LandingPage({ onSelectService }: LandingPageProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#12080a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/55">
              Welcome
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
              <span className="text-white">Easternhills</span>{' '}
              <span className="bg-gradient-to-r from-red-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">
                Food &amp; Transport
              </span>
            </h1>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45">
              Services
            </p>
            <p className="mt-1 text-sm font-medium text-white/80">Restaurant and Car Rental</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              Choose your portal on the main page
            </div>

            <h2 className="mt-6 max-w-3xl text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">
              One brand.
              <br />
              Two main services.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              Customers can now choose between the restaurant portal and the car rental portal as
              soon as they arrive on the main page.
            </p>

          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {SERVICE_CARDS.map((service) => {
              const Icon = service.icon;

              return (
                <button
                  key={service.id}
                  id={service.id === 'restaurant' ? 'btn_select_restaurant' : 'btn_select_car_rental'}
                  type="button"
                  onClick={() => onSelectService(service.id)}
                  className={`group rounded-[2rem] border p-7 text-left shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/30 sm:p-8 ${service.accentClasses}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${service.iconWrapClasses}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/55">
                      {service.title}
                    </span>
                  </div>

                  <h3 className="mt-7 text-3xl font-black uppercase tracking-tight text-white">
                    {service.heading}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                    {service.description}
                  </p>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-xs font-medium text-white/75">
                    {service.contact}
                  </div>

                  <div className={`mt-7 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] ${service.ctaClasses}`}>
                    <span>{service.id === 'restaurant' ? 'Enter food portal' : 'Open rental portal'}</span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Dine-in and takeaway ordering from one restaurant menu.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Car rental enquiries and bookings with direct WhatsApp support.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              A single Easternhills brand experience for food and transport.
            </div>
          </div>
        </main>

        <footer className="border-t border-white/10 pt-5 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-white/35">
          Easternhills Food &amp; Transport
        </footer>
      </div>
    </div>
  );
}
