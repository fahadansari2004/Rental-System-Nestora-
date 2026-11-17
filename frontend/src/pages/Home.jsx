import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/property/SearchBar';
import PropertyCard from '../components/property/PropertyCard';
import { CardSkeleton } from '../components/common/Loader';
import { propertyService } from '../services/propertyService';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Home as HomeIcon,
  Building2,
  Users,
  Store,
  Compass,
  MapPin,
  CalendarCheck,
  Check,
  Building,
} from 'lucide-react';
import Button from '../components/common/Button';

// 4 Property Category Discovery Cards
const mainCategoryCards = [
  {
    title: 'Residential',
    subtitle: 'Apartments, Flats, Villas & Independent Houses',
    count: '150+ Verified Homes',
    category: 'Residential',
    icon: HomeIcon,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=700&q=80',
    link: '/explore?category=Residential',
    gradient: 'from-emerald-950/80 via-emerald-950/30 to-transparent',
  },
  {
    title: 'Rooms & PG',
    subtitle: 'Single Rooms, Shared Accommodation & Paying Guest',
    count: '80+ Verified Rooms',
    category: 'Rooms & PG',
    icon: Users,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=700&q=80',
    link: '/explore?category=Rooms%20%26%20PG',
    gradient: 'from-indigo-950/80 via-indigo-950/30 to-transparent',
  },
  {
    title: 'Shops & Retail',
    subtitle: 'Prime Road-Front Showrooms & Commercial Retail Outlets',
    count: '45+ Prime Spaces',
    category: 'Commercial',
    icon: Store,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80',
    link: '/explore?category=Commercial&propertyType=Retail%20Shop',
    gradient: 'from-amber-950/80 via-amber-950/30 to-transparent',
  },
  {
    title: 'Office & Commercial',
    subtitle: 'Plug-and-Play Office Spaces, Tech Parks & Full Floors',
    count: '60+ Ready Offices',
    category: 'Commercial',
    icon: Building2,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80',
    link: '/explore?category=Commercial&propertyType=Office%20Space',
    gradient: 'from-slate-950/80 via-slate-950/30 to-transparent',
  },
];

// Popular Kerala Location Cards
const keralaHotspots = [
  {
    name: 'Kochi',
    tag: 'Commercial & Coastal Hub',
    locality: 'Marine Drive • Edappally • Panampilly Nagar',
    count: '120+ Listings',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
    query: 'Kochi',
  },
  {
    name: 'Kakkanad',
    tag: 'IT Corridor & Tech Hub',
    locality: 'Infopark Phase 1 & 2 • SmartCity • Rajagiri',
    count: '95+ Listings',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    query: 'Kakkanad',
  },
  {
    name: 'Thiruvananthapuram',
    tag: 'Capital City & Technopark',
    locality: 'Kazhakkoottam • Kowdiar • Technopark Phase 3',
    count: '85+ Listings',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    query: 'Thiruvananthapuram',
  },
  {
    name: 'Kozhikode',
    tag: 'Malabar Cultural & Culinary Hub',
    locality: 'Mavoor Road • Beach Road • Cyberpark',
    count: '60+ Listings',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    query: 'Kozhikode',
  },
  {
    name: 'Thrissur',
    tag: 'Cultural Capital of Kerala',
    locality: 'Swaraj Round • Punkunnam • Ayyanthole',
    count: '45+ Listings',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    query: 'Thrissur',
  },
  {
    name: 'Kottayam',
    tag: 'Land of Letters & Lakes',
    locality: 'Kanjikuzhy • Kumaranalloor • Baker Junction',
    count: '35+ Listings',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    query: 'Kottayam',
  },
];

import { mockProperties } from '../data/mockData';

const getCleanApprovedList = () => {
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('nestora_properties_store') || '[]');
  } catch {}
  const list = Array.isArray(stored) && stored.length > 0 ? stored : mockProperties;
  let deletedIds = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
  } catch {}
  if (!Array.isArray(deletedIds)) deletedIds = [];
  return list.filter((p) => {
    const pid = String(p._id || p.id || '');
    const cid = String(p.customId || '');
    const isDeleted = deletedIds.includes(pid) || (cid && deletedIds.includes(cid));
    return !isDeleted && p.approvalStatus === 'approved' && p.isActive !== false;
  });
};

const filterCleanList = (arr) => {
  if (!Array.isArray(arr)) return [];
  let deletedIds = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem('nestora_deleted_properties') || '[]');
  } catch {}
  if (!Array.isArray(deletedIds) || deletedIds.length === 0) return arr;
  return arr.filter((p) => {
    const pid = String(p._id || p.id || '');
    const cid = String(p.customId || '');
    return !deletedIds.includes(pid) && (!cid || !deletedIds.includes(cid));
  });
};

const Home = () => {
  // Pre-seed state immediately from clean approved local store so home page loads in 0ms with zero skeleton delay
  const [featuredProperties, setFeaturedProperties] = useState(() => {
    const initial = getCleanApprovedList();
    return initial.slice(0, 3);
  });
  const [recentProperties, setRecentProperties] = useState(() => {
    const initial = getCleanApprovedList();
    return initial.slice(0, 6);
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHomes = async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          propertyService.getProperties({ limit: 3, sortBy: 'rating' }),
          propertyService.getProperties({ limit: 6, sortBy: 'newest' }),
        ]);

        if (!isMounted) return;

        const cleanApproved = getCleanApprovedList();

        const featured =
          featuredRes?.properties && featuredRes.properties.length > 0
            ? filterCleanList(featuredRes.properties)
            : cleanApproved.slice(0, 3);

        const recent =
          recentRes?.properties && recentRes.properties.length > 0
            ? filterCleanList(recentRes.properties)
            : cleanApproved.slice(0, 6);

        setFeaturedProperties(featured);
        setRecentProperties(recent);
      } catch (error) {
        console.error('Error fetching properties:', error);
        if (isMounted) {
          const cleanApproved = getCleanApprovedList();
          setFeaturedProperties(cleanApproved.slice(0, 3));
          setRecentProperties(cleanApproved.slice(0, 6));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHomes();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayFeatured = filterCleanList(featuredProperties);
  const displayRecent = filterCleanList(recentProperties);

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION (Sharp luxury modern house visual, dark navy crisp headline, emerald highlights) */}
      <section className="relative min-h-[580px] lg:min-h-[640px] xl:min-h-[680px] flex items-center bg-white overflow-hidden">
        {/* Right-Side Luxury Modern House Photograph */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[52%] xl:w-[50%] h-full hidden lg:block overflow-hidden pointer-events-none select-none">
          <img
            src="/assets/hero-house-sharp.jpg"
            alt="Luxury Modern House"
            className="w-full h-full object-cover object-left"
          />
          {/* Subtle White Gradient on Left Edge for smooth seamless transition */}
          <div className="absolute inset-y-0 left-0 w-28 xl:w-44 bg-gradient-to-r from-white via-white/70 to-transparent pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-10 sm:py-14 lg:py-18 w-full">
          <div className="max-w-xl lg:max-w-2xl xl:max-w-[620px] space-y-6 sm:space-y-7">
            {/* Verified Residences & Monthly Rentals Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dcf0e7] border border-[#bce2d3] text-emerald-900 text-xs font-black tracking-wider shadow-xs w-fit">
              <span className="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span>VERIFIED RESIDENCES &amp; MONTHLY RENTALS</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-black text-slate-900 tracking-tight leading-[1.08]">
              Find your ideal<br className="hidden sm:inline" /> rental home with{' '}
              <span className="text-emerald-800">
                Nestora.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-lg">
              Browse verified modern apartments, luxury villas, and executive lofts with transparent monthly rates, protected security deposits, and zero surprises.
            </p>

            {/* Mobile Stacked House Image */}
            <div className="block lg:hidden my-3 rounded-2xl overflow-hidden shadow-lg aspect-[16/10] bg-slate-900">
              <img
                src="/assets/hero-house-sharp.jpg"
                alt="Luxury Modern House"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Search Bar */}
            <div className="pt-1">
              <SearchBar />
            </div>

            {/* Three Feature Highlights */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-2 text-slate-700">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-800 stroke-[2.2] shrink-0" />
                <div className="text-xs leading-tight">
                  <div className="text-slate-900 font-extrabold">100% Inspected</div>
                  <div className="text-slate-500 font-medium">&amp; Verified</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-5 h-5 text-emerald-800 stroke-[2.2] shrink-0" />
                <div className="text-xs leading-tight">
                  <div className="text-slate-900 font-extrabold">Standardized</div>
                  <div className="text-slate-500 font-medium">Monthly Leases</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-emerald-800 stroke-[2.2] shrink-0" />
                <div className="text-xs leading-tight">
                  <div className="text-slate-900 font-extrabold">Fast Digital</div>
                  <div className="text-slate-500 font-medium">Move-In Approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROPERTY CATEGORY DISCOVERY (Residential, Rooms & PG, Shops & Retail, Office & Commercial) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">
              EXPLORE BY CATEGORY
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Rent Across Kerala &amp; Metros
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Choose from luxury family homes, shared bachelor/student rooms, prime retail spaces, or IT offices.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm" icon={ArrowRight}>
              Browse All Categories
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainCategoryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.link}
                className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 shadow-xs hover:shadow-xl transition-all duration-300 card-hover-effect"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-105 transition-all duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${card.gradient}`} />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-xl text-white group-hover:text-emerald-300 transition-colors">
                      {card.title}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-1 mb-1 font-medium">
                    {card.subtitle}
                  </p>
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    {card.count}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED PROPERTIES (INR Monthly Rent) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">
              HANDPICKED RESIDENCES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Verified Rentals
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Inspected properties offering premium comfort, transparent terms, and verified ownership.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm" icon={ArrowRight}>
              View All Properties
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : displayFeatured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFeatured.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
            <HomeIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">No Verified Featured Rentals Live</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Properties in this section have been unlisted or removed. Check back soon for handpicked listings.
            </p>
          </div>
        )}
      </section>

      {/* 4. POPULAR KERALA LOCATIONS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">
            REGIONAL HUBS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Popular Locations in Kerala
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Discover top-rated rental opportunities across Kerala's key metropolitan cities and tech clusters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {keralaHotspots.map((spot) => (
            <Link
              key={spot.name}
              to={`/explore?city=${encodeURIComponent(spot.query)}`}
              className="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-[11px] shadow-md">
                  {spot.count}
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="text-xs font-semibold text-emerald-300 block">
                    {spot.tag}
                  </span>
                  <h3 className="text-xl font-black text-white group-hover:text-emerald-200 transition-colors">
                    {spot.name}
                  </h3>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between text-xs text-slate-600 bg-white">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <MapPin className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span className="truncate">{spot.locality}</span>
                </span>
                <span className="text-emerald-800 font-bold shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                  Explore &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. RECENTLY ADDED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 block mb-1">
              FRESH ON THE MARKET
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Recently Listed Properties
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              New residential apartments, student rooms, and commercial leases added this week.
            </p>
          </div>
          <Link to="/explore?sortBy=newest">
            <Button variant="outline" size="sm" icon={Compass}>
              Explore Latest Listings
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : displayRecent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecent.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-700">No Fresh Listings Added Recently</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Newly verified properties across Kerala will appear here once published.
            </p>
          </div>
        )}
      </section>

      {/* 6. HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 sm:p-14">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
              STREAMLINED RENTAL JOURNEY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How Nestora Works
            </h2>
            <p className="text-sm text-slate-500">
              Simple 3-step digital leasing for residential tenants, students, and commercial businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-black text-lg flex items-center justify-center border border-emerald-100">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900">Search &amp; Filter Verified Spaces</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter by Kerala locality, category (Residential, Rooms &amp; PG, Commercial), BHK, furnishing, and INR monthly budget. Every listing features authentic photos and clear pricing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-black text-lg flex items-center justify-center border border-emerald-100">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900">Schedule a Tour &amp; Apply Online</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Book a walkthrough or video tour directly. Send your tenant profile and lease duration preferences to the verified property owner with zero brokerage interference.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-black text-lg flex items-center justify-center border border-emerald-100">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900">Execute Digital Agreement &amp; Move In</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Standardized 11-month Kerala rental agreements, clear security deposit receipts, and quick key handover with full support throughout your lease term.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ABOUT NESTORA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"
                alt="Nestora Architecture"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-emerald-800 text-white p-6 rounded-2xl shadow-xl hidden sm:block max-w-xs">
              <span className="text-3xl font-black block">99.4%</span>
              <span className="text-xs font-semibold text-emerald-100">
                Verified Tenant &amp; Owner Satisfaction Across Kerala &amp; Indian Metros
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ABOUT NESTORA
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Elevating Indian property rentals with design, trust, and zero brokerage.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Nestora was built to eliminate the frustration of misleading photos, exorbitant broker commissions, and tedious paperwork. We connect genuine property owners with responsible renters seeking quality apartments, shared rooms, and commercial business spaces across Kerala and India.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xl font-black text-emerald-800">5,000+</span>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">Kerala Rentals Verified</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xl font-black text-emerald-800">100%</span>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">Protected Security Deposits</p>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/explore">
                <Button variant="primary" size="md" icon={ArrowRight}>
                  Explore Available Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OWNER CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-[#07362d] rounded-3xl p-8 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-emerald-950/20">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
              PROPERTY OWNERS &amp; LANDLORDS
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              List your residential, room or commercial space on Nestora.
            </h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Connect directly with vetted tenants across Kochi, Kakkanad, Trivandrum, Kozhikode, and major Indian cities. Zero listing fees and instant digital move-in agreements.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link to="/properties/new">
              <Button
                variant="accent"
                size="lg"
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-black shadow-lg"
              >
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
