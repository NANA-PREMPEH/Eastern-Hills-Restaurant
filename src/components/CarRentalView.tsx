/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Car,
  ChevronRight,
  Clock,
  MessageSquare,
  Phone,
  Settings2,
  ShieldCheck,
  Star,
  Utensils,
  Users,
} from 'lucide-react';
import { CarListing } from '../data/carFleet';
import StaffAccessModal from './StaffAccessModal';

const RENTAL_WHATSAPP_DISPLAY = '0555029441';
const RENTAL_WHATSAPP_LINK = '233555029441';

interface CarRentalViewProps {
  carFleet: CarListing[];
  onBack: () => void;
  onOpenAdmin: (pin: string) => void;
  onGoToRestaurant: () => void;
}

const buildWhatsappUrl = (message: string) =>
  `https://wa.me/${RENTAL_WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;

const readLocalStorageValue = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(`Unable to read localStorage key "${key}".`, error);
    return null;
  }
};

const writeLocalStorageValue = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Unable to save localStorage key "${key}".`, error);
  }
};

export default function CarRentalView({
  carFleet,
  onBack,
  onOpenAdmin,
  onGoToRestaurant,
}: CarRentalViewProps) {
  const envAdminPin = import.meta.env.VITE_ADMIN_PIN?.trim() ?? '';
  const safeCarFleet = Array.isArray(carFleet) ? carFleet : [];
  const [isStaffAccessOpen, setIsStaffAccessOpen] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinConfirmation, setAdminPinConfirmation] = useState('');
  const [adminErrorMessage, setAdminErrorMessage] = useState('');
  const [storedAdminPin, setStoredAdminPin] = useState(() => {
    return readLocalStorageValue('eastern_hills_admin_pin')?.trim() ?? '';
  });
  const tapCountRef = useRef(0);
  const tapResetTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const configuredAdminPin = envAdminPin || storedAdminPin;
  const hasConfiguredAdminPin = configuredAdminPin.length > 0;
  const usesEnvironmentPin = envAdminPin.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        openStaffAccess();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTapResetTimer();
      clearLongPressTimer();
    };
  }, []);

  const clearTapResetTimer = () => {
    if (tapResetTimerRef.current !== null) {
      window.clearTimeout(tapResetTimerRef.current);
      tapResetTimerRef.current = null;
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const resetStaffAccessForm = () => {
    setAdminErrorMessage('');
    setAdminPin('');
    setAdminPinConfirmation('');
  };

  const openStaffAccess = () => {
    clearTapResetTimer();
    clearLongPressTimer();
    tapCountRef.current = 0;
    resetStaffAccessForm();
    setIsStaffAccessOpen(true);
  };

  const closeStaffAccess = () => {
    clearTapResetTimer();
    clearLongPressTimer();
    tapCountRef.current = 0;
    resetStaffAccessForm();
    setIsStaffAccessOpen(false);
  };

  const handleHiddenAdminTap = () => {
    tapCountRef.current += 1;
    clearTapResetTimer();

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      openStaffAccess();
      return;
    }

    tapResetTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);
  };

  const handleSecretPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
      openStaffAccess();
    }, 900);
  };

  const handleSecretPointerUp = () => {
    clearLongPressTimer();
  };

  const handleStaffAccessSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedPin = adminPin.trim();

    if (!normalizedPin) {
      setAdminErrorMessage('Enter the staff PIN to continue.');
      return;
    }

    if (!hasConfiguredAdminPin) {
      if (normalizedPin.length < 4) {
        setAdminErrorMessage('Create a staff PIN with at least 4 characters.');
        return;
      }

      if (normalizedPin !== adminPinConfirmation.trim()) {
        setAdminErrorMessage('The PIN confirmation does not match.');
        return;
      }

      writeLocalStorageValue('eastern_hills_admin_pin', normalizedPin);
      setStoredAdminPin(normalizedPin);
      closeStaffAccess();
      onOpenAdmin(normalizedPin);
      return;
    }

    if (normalizedPin !== configuredAdminPin) {
      setAdminErrorMessage('That staff PIN is incorrect.');
      return;
    }

    closeStaffAccess();
    onOpenAdmin(normalizedPin);
  };

  const handleBookNow = (car: CarListing) => {
    const message =
      `CAR RENTAL ENQUIRY - EASTERNHILLS FOOD & TRANSPORT\n` +
      `Vehicle: ${car.name}\n` +
      `Type: ${car.type}\n` +
      `Seats: ${car.seats}\n` +
      `Transmission: ${car.transmission}\n` +
      `Daily Rate: GHS ${car.dailyRate.toLocaleString()}\n\n` +
      `Hello, I would like to book the ${car.name}. Please share availability and the next steps.`;

    window.open(buildWhatsappUrl(message), '_blank');
  };

  const handleGeneralEnquiry = () => {
    const message =
      'Hello, I would like to enquire about your available rental cars, pricing, and booking process.';

    window.open(buildWhatsappUrl(message), '_blank');
  };

  return (
    <div className="min-h-screen bg-[#090c18] pb-24 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.14),_transparent_24%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#090c18]/88 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <button
                id="btn_car_rental_back"
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Home
              </button>

              <button
                id="btn_go_to_food_portal"
                type="button"
                onClick={onGoToRestaurant}
                className="flex items-center gap-1.5 rounded-xl border border-red-400/25 bg-red-500/12 px-3 py-2 text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/20 hover:text-white"
              >
                <Utensils className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Food Portal</span>
                <span className="sm:hidden">Food</span>
              </button>
            </div>

            <div className="hidden h-6 w-px bg-white/10 sm:block" />

            <button
              id="btn_hidden_car_admin_trigger"
              type="button"
              onClick={handleHiddenAdminTap}
              onPointerDown={handleSecretPointerDown}
              onPointerUp={handleSecretPointerUp}
              onPointerLeave={handleSecretPointerUp}
              onPointerCancel={handleSecretPointerUp}
              className="flex w-full flex-col rounded-xl border-0 bg-transparent p-0 text-left focus:outline-none sm:w-auto sm:min-w-0 sm:flex-none"
              aria-label="Easternhills Car Rental Portal"
            >
              <span className="text-[13px] font-black uppercase tracking-[0.1em] leading-tight sm:text-base sm:tracking-[0.14em]">
                <span className="text-white">Easternhills</span>{' '}
                <span className="text-amber-300">Transport</span>
              </span>
              <span className="hidden text-[11px] text-white/45 sm:block">
                Car rental portal and driver enquiries
              </span>
            </button>
          </div>

          <a
            id="link_car_rental_phone"
            href={buildWhatsappUrl('Hello, I would like to enquire about car rental.')}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/12 px-3 py-2 text-center text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 sm:w-auto sm:justify-start"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">WhatsApp {RENTAL_WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8">
        <section className="overflow-hidden rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/18 via-[#1b2135] to-[#0d111f] p-6 shadow-2xl shadow-black/20 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-200">
                <Car className="h-3.5 w-3.5" />
                Car Rental Portal
              </div>

              <h1 className="mt-5 text-3xl font-black uppercase tracking-tight text-white sm:text-5xl">
                Easternhills car rental portal
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                Pick a vehicle, send your request, and continue the booking with the transport team
                on WhatsApp. The rental contact for this service is {RENTAL_WHATSAPP_DISPLAY}.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  id="btn_car_general_enquiry"
                  type="button"
                  onClick={handleGeneralEnquiry}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat on WhatsApp
                </button>

                <a
                  href={`tel:${RENTAL_WHATSAPP_DISPLAY}`}
                  className="rounded-xl border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Call {RENTAL_WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: ShieldCheck, label: 'Trusted fleet' },
                { icon: Star, label: 'Executive and everyday options' },
                { icon: Clock, label: 'Fast responses on WhatsApp' },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/75"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/14 text-amber-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                Available fleet
              </p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-white">
                Choose a vehicle
              </h2>
            </div>

            <p className="text-sm text-white/55">
              {safeCarFleet.length} vehicles ready for booking enquiries.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {safeCarFleet.map((car) => (
              <article
                key={car.id}
                className="flex flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-xl shadow-black/15 transition duration-300 hover:-translate-y-1 hover:border-amber-300/35"
              >
                <div className={`relative flex items-center justify-center bg-gradient-to-br ${car.colorClass} px-6 py-9`}>
                  <div className="absolute inset-0 bg-black/18" />
                  <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
                    {car.type}
                  </span>
                  {car.image ? (
                    <img
                      src={car.image}
                      alt={car.name}
                      className="relative max-h-44 w-auto max-w-full rounded-2xl object-contain drop-shadow-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="relative text-7xl drop-shadow-xl">{car.emoji}</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-black text-white">{car.name}</h3>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/55">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {car.seats} seats
                    </span>
                    <span className="h-3 w-px bg-white/12" />
                    <span className="flex items-center gap-1.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      {car.transmission}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {car.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="mb-4 border-t border-white/10 pt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                        Daily rate
                      </p>
                      <p className="mt-1 text-2xl font-black text-amber-300">
                        GHS {car.dailyRate.toLocaleString()}
                      </p>
                    </div>

                    <button
                      id={`btn_book_car_${car.id}`}
                      type="button"
                      onClick={() => handleBookNow(car)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-300"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Book on WhatsApp
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {safeCarFleet.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-white/65">
              No vehicles are currently listed. Hidden staff access can add the first vehicle.
            </div>
          )}
        </section>

        <section className="mt-12 rounded-[1.75rem] border border-white/10 bg-white/6 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Need a custom transport quote?
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Use the rental WhatsApp number for airport pickups, long-term rentals, business
                travel, or group transport enquiries.
              </p>
            </div>

            <button
              id="btn_car_whatsapp_cta"
              type="button"
              onClick={handleGeneralEnquiry}
              className="shrink-0 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400"
            >
              WhatsApp {RENTAL_WHATSAPP_DISPLAY}
            </button>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-white/10 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/40">
          Easternhills Food &amp; Transport
        </p>
        <p className="mt-2 text-xs text-white/55">Rental WhatsApp: {RENTAL_WHATSAPP_DISPLAY}</p>
      </footer>

      <StaffAccessModal
        errorMessage={adminErrorMessage}
        hasConfiguredPin={hasConfiguredAdminPin}
        helperText={
          usesEnvironmentPin
            ? 'This app is using the staff PIN from VITE_ADMIN_PIN in your environment settings.'
            : 'Staff can open this hidden login by tapping the transport name 5 times, pressing and holding it, or pressing Ctrl+Shift+A on desktop.'
        }
        isOpen={isStaffAccessOpen}
        loginDescription="Enter the staff PIN to manage vehicles, rates, and car rental details."
        loginTitle="Fleet Admin Login"
        pin={adminPin}
        pinConfirmation={adminPinConfirmation}
        setupDescription="Set a private PIN for car rental staff access on this device."
        submitLoginLabel="Open Fleet Admin"
        submitSetupLabel="Save PIN & Open Fleet Admin"
        usesEnvironmentPin={usesEnvironmentPin}
        onClose={closeStaffAccess}
        onPinChange={setAdminPin}
        onPinConfirmationChange={setAdminPinConfirmation}
        onSubmit={handleStaffAccessSubmit}
      />
    </div>
  );
}
