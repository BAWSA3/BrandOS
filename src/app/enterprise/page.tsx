'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Shield,
  Users,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Headphones,
  Check,
  ArrowRight,
  ArrowLeft,
  Code2,
  Gauge,
  Database,
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: string;
  brandsManaged: string;
  interest: string;
  message: string;
}

export default function EnterprisePage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    teamSize: '',
    brandsManaged: '',
    interest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/enterprise/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          BrandOS
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/api-docs"
            className="flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            <Code2 className="h-3.5 w-3.5" /> API Docs
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* API Product Section */}
        <div className="mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5">
            <Code2 className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Brand Intelligence API</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            score any creator
            <br />
            via API_
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/50">
            Integrate BrandOS scoring into your platform. Get brand scores, archetype
            classification, AI insights, and historical trends for any X/Twitter creator — all via
            REST API.
          </p>

          {/* API stats */}
          <div className="mt-8 flex flex-wrap gap-8">
            {[
              { value: '5,400+', label: 'Creators scored' },
              { value: '8', label: 'Archetypes' },
              { value: '<2s', label: 'Response time' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* API code preview */}
          <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-6 font-mono text-sm">
            <div className="text-white/30 mb-3">// Score any X handle in one call</div>
            <div className="text-white/70">
              <span className="text-green-400">curl</span> -X POST
              https://mybrandos.app/api/v1/score \
            </div>
            <div className="text-white/70 pl-4">
              -H <span className="text-amber-300">&quot;x-api-key: bos_your_key&quot;</span> \
            </div>
            <div className="text-white/70 pl-4">
              -d <span className="text-amber-300">{`'{"username": "naval"}'`}</span>
            </div>
            <div className="mt-4 text-white/30">// → score: 91, archetype: FORESIGHT, insights: [...] </div>
          </div>

          {/* API capabilities grid */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Gauge className="h-5 w-5" />,
                title: 'Brand Score (0-100)',
                desc: 'Overall score + 4 phase breakdown: Identity, Consistency, Content, Growth',
              },
              {
                icon: <Database className="h-5 w-5" />,
                title: 'Archetype Engine',
                desc: '8 archetypes with evolution paths, tier levels, and personality profiles',
              },
              {
                icon: <BarChart3 className="h-5 w-5" />,
                title: 'Score History',
                desc: 'Track creator scores over time — trends, highs, lows, and growth',
              },
              {
                icon: <Zap className="h-5 w-5" />,
                title: 'Batch Scoring',
                desc: 'Score up to 10 creators per request, processed concurrently',
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: 'Profile Data',
                desc: 'Follower counts, verification, influence tier — no AI cost',
              },
              {
                icon: <Globe className="h-5 w-5" />,
                title: 'Leaderboard',
                desc: 'Top scored creators by week, month, or all-time rankings',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="mb-2 text-blue-400">{item.icon}</div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-white/40">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/api-docs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0047FF] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-[#0037CC]"
            >
              View API Docs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/api-docs#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              See Pricing
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-20 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-mono text-white/20">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Enterprise Platform Section */}
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left - Value Prop */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Enterprise Platform</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              brand consistency
              <br />
              at scale_
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Give your team the tools to maintain brand alignment across every piece of content,
              every channel, every time.
            </p>

            <div className="mt-10 space-y-6">
              <EnterpriseFeature
                icon={<Users className="h-5 w-5" />}
                title="unlimited team members"
                description="Role-based access for creators, brand managers, and executives."
              />
              <EnterpriseFeature
                icon={<Globe className="h-5 w-5" />}
                title="unlimited brands & platforms"
                description="Manage every brand in your portfolio across all platforms."
              />
              <EnterpriseFeature
                icon={<Lock className="h-5 w-5" />}
                title="sso / saml"
                description="Enterprise-grade security with your existing identity provider."
              />
              <EnterpriseFeature
                icon={<Shield className="h-5 w-5" />}
                title="audit logs & compliance"
                description="Full audit trail for regulated industries and compliance."
              />
              <EnterpriseFeature
                icon={<Zap className="h-5 w-5" />}
                title="custom ai training"
                description="Train the AI on your specific brand voice."
              />
              <EnterpriseFeature
                icon={<BarChart3 className="h-5 w-5" />}
                title="advanced analytics"
                description="Cross-brand consistency reporting and team performance."
              />
              <EnterpriseFeature
                icon={<Headphones className="h-5 w-5" />}
                title="dedicated support + sla"
                description="Named account manager, 99.9% uptime, and priority response."
              />
            </div>
          </div>

          {/* Right - Contact Form */}
          <div>
            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">we&apos;ll be in touch_</h2>
                <p className="mt-2 text-white/50">
                  Thanks for your interest. We&apos;ll reach out within 1 business day.
                </p>
                <Link
                  href="/api-docs"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  <Code2 className="h-4 w-4" /> View API Docs
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <h2 className="mb-6 text-xl font-bold text-white">get started_</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="name"
                      value={formData.name}
                      onChange={(v) => updateField('name', v)}
                      required
                    />
                    <FormField
                      label="work email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => updateField('email', v)}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="company"
                      value={formData.company}
                      onChange={(v) => updateField('company', v)}
                      required
                    />
                    <FormField
                      label="role / title"
                      value={formData.role}
                      onChange={(v) => updateField('role', v)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="team size"
                      value={formData.teamSize}
                      onChange={(v) => updateField('teamSize', v)}
                      options={[
                        { value: '', label: 'Select...' },
                        { value: '1-5', label: '1-5 people' },
                        { value: '5-10', label: '5-10 people' },
                        { value: '11-25', label: '11-25 people' },
                        { value: '26-100', label: '26-100 people' },
                        { value: '100+', label: '100+ people' },
                      ]}
                    />
                    <SelectField
                      label="interested in"
                      value={formData.interest}
                      onChange={(v) => updateField('interest', v)}
                      options={[
                        { value: '', label: 'Select...' },
                        { value: 'api', label: 'API Integration' },
                        { value: 'platform', label: 'Enterprise Platform' },
                        { value: 'both', label: 'Both' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">
                      tell us about your use case
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => updateField('message', e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      placeholder="How many creators do you work with? What would you integrate?"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Request API Key <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-xs text-white/30">
                  We&apos;ll respond within 1 business day. No spam, ever.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EnterpriseFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-white/40">{description}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  type = 'text',
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/60">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/60">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a1f]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
