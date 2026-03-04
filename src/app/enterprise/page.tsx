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
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: string;
  brandsManaged: string;
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
        <Link
          href="/pricing"
          className="flex items-center gap-1 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pricing
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left - Value Prop */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">Enterprise</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Brand consistency
              <br />
              at scale.
            </h1>
            <p className="mt-4 text-lg text-white/50">
              Give your team the tools to maintain perfect brand alignment across
              every piece of content, every channel, every time.
            </p>

            <div className="mt-10 space-y-6">
              <EnterpriseFeature
                icon={<Users className="h-5 w-5" />}
                title="Unlimited team members"
                description="Role-based access for content creators, brand managers, and executives."
              />
              <EnterpriseFeature
                icon={<Globe className="h-5 w-5" />}
                title="Unlimited brands & platforms"
                description="Manage every brand in your portfolio across all social platforms."
              />
              <EnterpriseFeature
                icon={<Lock className="h-5 w-5" />}
                title="SSO / SAML authentication"
                description="Enterprise-grade security with your existing identity provider."
              />
              <EnterpriseFeature
                icon={<Shield className="h-5 w-5" />}
                title="Audit logs & compliance"
                description="Full audit trail for regulated industries and compliance requirements."
              />
              <EnterpriseFeature
                icon={<Zap className="h-5 w-5" />}
                title="Custom AI training"
                description="Train the AI on your specific brand voice for even better results."
              />
              <EnterpriseFeature
                icon={<BarChart3 className="h-5 w-5" />}
                title="Advanced analytics dashboard"
                description="Cross-brand consistency reporting and team performance metrics."
              />
              <EnterpriseFeature
                icon={<Headphones className="h-5 w-5" />}
                title="Dedicated support + SLA"
                description="Named account manager, 99.9% uptime SLA, and priority response."
              />
            </div>

            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm font-medium text-white">Trusted by teams who care about brand</p>
              <p className="mt-1 text-xs text-white/40">
                Starting at $500/month for teams of 5+. Custom pricing based on seats and usage.
                Annual contracts available with preferred rates.
              </p>
            </div>
          </div>

          {/* Right - Contact Form */}
          <div>
            {submitted ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">We&apos;ll be in touch!</h2>
                <p className="mt-2 text-white/50">
                  Thanks for your interest in BrandOS Enterprise. Our team will reach out
                  within 1 business day to discuss your needs.
                </p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Pricing
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <h2 className="mb-6 text-xl font-bold text-white">Talk to our team</h2>

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Name"
                      value={formData.name}
                      onChange={(v) => updateField('name', v)}
                      required
                    />
                    <FormField
                      label="Work Email"
                      type="email"
                      value={formData.email}
                      onChange={(v) => updateField('email', v)}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Company"
                      value={formData.company}
                      onChange={(v) => updateField('company', v)}
                      required
                    />
                    <FormField
                      label="Role / Title"
                      value={formData.role}
                      onChange={(v) => updateField('role', v)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Team Size"
                      value={formData.teamSize}
                      onChange={(v) => updateField('teamSize', v)}
                      options={[
                        { value: '', label: 'Select...' },
                        { value: '5-10', label: '5-10 people' },
                        { value: '11-25', label: '11-25 people' },
                        { value: '26-50', label: '26-50 people' },
                        { value: '51-100', label: '51-100 people' },
                        { value: '100+', label: '100+ people' },
                      ]}
                      required
                    />
                    <SelectField
                      label="Brands Managed"
                      value={formData.brandsManaged}
                      onChange={(v) => updateField('brandsManaged', v)}
                      options={[
                        { value: '', label: 'Select...' },
                        { value: '1-5', label: '1-5 brands' },
                        { value: '6-15', label: '6-15 brands' },
                        { value: '16-50', label: '16-50 brands' },
                        { value: '50+', label: '50+ brands' },
                      ]}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">
                      Tell us about your needs
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => updateField('message', e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                      placeholder="What challenges are you trying to solve with BrandOS?"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Request a Demo <ArrowRight className="h-4 w-4" />
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
