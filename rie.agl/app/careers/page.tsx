'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Filter, Globe, Anchor, Loader2, Briefcase, Users, ChevronDown, X } from 'lucide-react';
import JobCard from '../components/jobs/JobCard';
import type { Job, Division, Region, EmploymentType, ExperienceLevel } from '../types';

const DIVISIONS: Division[] = ['Port', 'Rail', 'Logistics'];
const REGIONS: Region[] = ['West Africa', 'East Africa', 'Southern Africa', 'Central Africa', 'North Africa'];
const EMP_TYPES = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];
const EXP_LEVELS: ExperienceLevel[] = ['Entry', 'Mid', 'Senior', 'Executive'];

export default function CareersPage() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [search,   setSearch]   = useState('');
  const [division, setDivision] = useState<Division | 'all'>('all');
  const [region,   setRegion]   = useState<Region | 'all'>('all');
  const [empType,  setEmpType]  = useState<EmploymentType | 'all'>('all');
  const [expLevel, setExpLevel] = useState<ExperienceLevel | 'all'>('all');

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => r.json())
      .then(d => { if (d.success) setJobs(d.data ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const publishedJobs = useMemo(() => jobs.filter(j => j.status === 'published'), [jobs]);

  const filteredJobs = useMemo(() => {
    return publishedJobs.filter(job => {
      if (division !== 'all' && job.division  !== division) return false;
      if (region   !== 'all' && job.region    !== region)   return false;
      if (empType  !== 'all' && job.employmentType !== empType) return false;
      if (expLevel !== 'all' && job.experienceLevel !== expLevel) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          job.title.toLowerCase().includes(q) ||
          (job.location ?? '').toLowerCase().includes(q) ||
          (job.country  ?? '').toLowerCase().includes(q) ||
          (job.summary  ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [publishedJobs, division, region, empType, expLevel, search]);

  const hasFilters = division !== 'all' || region !== 'all' || empType !== 'all' || expLevel !== 'all';

  return (
    <div className="min-h-screen bg-[#F4F6F9]">

      {/* ── Sticky Dark Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0A0F24] border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/careers" className="flex items-center gap-3 group">
            <img
              src="/AGL.logo.png"
              alt="AGL Logo"
              className="h-9 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform duration-200"
            />
            <div>
              <div className="text-white font-bold text-sm leading-tight tracking-wide">AGL Careers</div>
              <div className="text-white/40 text-xs leading-tight">Africa Global Logistics</div>
            </div>
          </Link>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-1.5 text-white/50 text-xs font-medium">
              <Globe size={13} className="text-[#E66423]" />
              <span>51 Countries · 23K+ Employees</span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-[65vh] flex flex-col justify-center items-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/logistics2.mp4" type="video/mp4" />
        </video>

        {/* Premium blend overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F24]/90 via-[#001CB0]/80 to-[#0025E0]/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[#0A0F24]/40" />

        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Orange glow orb */}
        <div className="absolute top-[-80px] right-[-60px] w-[500px] h-[500px] rounded-full bg-[#E66423] opacity-[0.2] blur-[100px] pointer-events-none" />
        {/* Blue glow orb bottom-left */}
        <div className="absolute bottom-[-100px] left-[-80px] w-[400px] h-[400px] rounded-full bg-[#001CB0] opacity-[0.15] blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 md:py-36 flex flex-col items-center justify-center text-center w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold mb-10 tracking-widest uppercase bg-[#E66423]/20 text-[#E66423] border border-[#E66423]/30">
            <Anchor size={12} />
            {loading ? '…' : publishedJobs.length} Open Positions Across Africa
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-[1.05] tracking-tight">
            Join Africa&apos;s Largest<br />
            <span className="text-[#E66423]">Logistics Network</span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-14 leading-relaxed font-light">
            Africa Global Logistics operates 24 port concessions and 2 rail concessions across 51 African countries. Shape the continent&apos;s future with us.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-3xl mx-auto relative group">
            <div className="absolute inset-0 bg-[#E66423]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden focus-within:border-white/40 focus-within:bg-white/15 transition-all duration-300">
              <Search size={20} className="absolute left-6 text-white/40 pointer-events-none" />
              <input
                type="text"
                className="flex-1 bg-transparent text-white placeholder-white/40 text-lg py-5 pl-16 pr-6 outline-none w-full min-w-0"
                placeholder="Search by role, location, country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="pr-5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-10 md:gap-20">
            {[
              { value: '51', label: 'Countries' },
              { value: '23K+', label: 'Employees' },
              { value: '24', label: 'Port Concessions' },
              { value: '2', label: 'Rail Concessions' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black text-white">{stat.value}</div>
                <div className="text-white/40 text-sm font-medium mt-1.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters + Jobs ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 mr-1">
              <Filter size={14} className="text-[#001CB0]" />
              <span>Filter:</span>
            </div>

            {/* Division */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 cursor-pointer transition-all"
                value={division}
                onChange={e => setDivision(e.target.value as Division | 'all')}
              >
                <option value="all">All Divisions</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Region */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 cursor-pointer transition-all"
                value={region}
                onChange={e => setRegion(e.target.value as Region | 'all')}
              >
                <option value="all">All Regions</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Employment Type */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 cursor-pointer transition-all"
                value={empType}
                onChange={e => setEmpType(e.target.value as EmploymentType | 'all')}
              >
                <option value="all">All Types</option>
                {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Experience Level */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-gray-50 text-[#0A0F24] focus:outline-none focus:border-[#001CB0] focus:ring-2 focus:ring-[#001CB0]/10 cursor-pointer transition-all"
                value={expLevel}
                onChange={e => setExpLevel(e.target.value as ExperienceLevel | 'all')}
              >
                <option value="all">All Levels</option>
                {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#E66423] bg-[#E66423]/10 hover:bg-[#E66423]/20 transition-all"
                onClick={() => { setDivision('all'); setRegion('all'); setEmpType('all'); setExpLevel('all'); }}
              >
                <X size={13} /> Clear filters
              </button>
            )}

            <div className="ml-auto flex items-center gap-2 text-sm font-medium text-gray-400">
              <Briefcase size={14} className="text-[#001CB0]" />
              {loading ? 'Loading…' : `${filteredJobs.length} position${filteredJobs.length !== 1 ? 's' : ''} found`}
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
            <Loader2 size={32} className="animate-spin text-[#001CB0]" />
            <span className="text-sm font-medium">Loading open positions…</span>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="flex flex-wrap gap-6 justify-center w-full">
            {filteredJobs.map((job, i) => (
              <div
                key={job.id}
                className="animate-fade-in-up w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <JobCard job={job} variant="public" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-[#F4F6F9] flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-[#0A0F24] mb-2">No positions found</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">Try adjusting your filters or search terms to discover more opportunities.</p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#001CB0] bg-[#001CB0]/10 hover:bg-[#001CB0]/20 transition-all"
              onClick={() => { setSearch(''); setDivision('all'); setRegion('all'); setEmpType('all'); setExpLevel('all'); }}
            >
              <X size={15} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="mt-24 bg-[#0A0F24] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs bg-[#E66423]">AGL</div>
            <span className="text-white/60 text-sm font-medium">Africa Global Logistics</span>
          </div>
          <p className="text-white/30 text-xs text-center">
            © 2026 Africa Global Logistics · POPIA Compliant Recruitment · Powered by RIE AGL
          </p>
          <div className="flex items-center gap-1.5 text-white/30 text-xs">
            <Globe size={12} />
            <span>51 Countries · 23,000+ Employees</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
