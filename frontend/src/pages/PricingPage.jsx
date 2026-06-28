import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { usePricingStore } from '../store/usePricingStore';

const PricingPage = () => {
  const { billingPeriod, setBillingPeriod } = usePricingStore();

  // Pricing plans definition
  const plans = [
    {
      name: 'Scout',
      eyebrow: 'FOUNDER SEED',
      price: 0,
      priceAnnual: 0,
      usdEquiv: 0,
      usdEquivAnnual: 0,
      description: 'Essential failure archives and pattern-matching for early-stage validation.',
      features: [
        'Access to core failure archives',
        'Basic search & filters',
        '5 AI Risk Scans per month',
        'Founder Confessions access',
        'Community Forum access'
      ],
      cta: 'Start Free Trial',
      featured: false
    },
    {
      name: 'Operator',
      eyebrow: 'GROWTH LAYER',
      price: 1499,
      priceAnnual: 999,
      usdEquiv: 18,
      usdEquivAnnual: 12,
      description: 'Comprehensive research, unlimited AI scans, and pitch deck risk audits.',
      features: [
        'Full postmortem database access',
        'Advanced failure pattern matching',
        'Unlimited AI Risk Scans',
        'Pitch Deck Autopsy tool',
        'Interactive AI Investigator Chat',
        'Bookmarks & search history trail'
      ],
      cta: 'Upgrade to Operator',
      featured: true
    },
    {
      name: 'Vault',
      eyebrow: 'ENTERPRISE SHIELD',
      price: 4999,
      priceAnnual: 3999,
      usdEquiv: 60,
      usdEquivAnnual: 48,
      description: 'Custom risk modeling, dedicated AI analysts, and competitor benchmarks.',
      features: [
        'Dedicated AI Risk Model training',
        'Competitor risk benchmarking',
        'Raw data export (CSV/JSON)',
        'Full developer API access',
        'Shared team workspace (5 seats)',
        'Priority diagnostic support'
      ],
      cta: 'Contact Sales',
      featured: false
    }
  ];

  // Framer Motion animation configs
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg text-text-primary py-16 px-4 sm:px-6 lg:px-8 font-sans overflow-x-hidden relative flex flex-col justify-center">
      
      {/* Background Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--color-border),0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--color-border),0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto w-full">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="font-data text-xs text-accent tracking-[0.25em] font-semibold uppercase mb-3 block">
            STRESS-TEST PLANS
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-text-primary tracking-tight mb-4">
            Secure your startup's future.
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Choose the diagnostic shielding you need to analyze market risk, validate unit economics, and avoid critical growth hurdles.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex justify-center items-center gap-3">
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-text-primary font-semibold' : 'text-text-muted'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
              className="w-14 h-7 rounded-full bg-surface-3 border border-border relative p-1 transition-colors duration-300 focus:outline-none"
            >
              <div
                className={`w-5 h-5 rounded-full bg-accent transition-all duration-300 ${
                  billingPeriod === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'text-text-primary font-semibold' : 'text-text-muted'}`}>
              Annual
              <span className="text-[10px] font-data font-bold bg-accent/20 text-accent border border-accent/30 px-1.5 py-0.5 rounded uppercase">
                Up to 33% Off
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
        >
          {plans.map((plan) => {
            const displayPrice = billingPeriod === 'annual' ? plan.priceAnnual : plan.price;
            const displayUsd = billingPeriod === 'annual' ? plan.usdEquivAnnual : plan.usdEquiv;
            const planBorder = plan.featured 
              ? 'border-2 border-accent shadow-elevated' 
              : 'border border-border';
            
            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                className={`rounded-card p-8 flex flex-col justify-between transition-all duration-300 relative backdrop-blur-[12px] bg-surface/50 ${planBorder} hover:border-accent-2/50`}
              >
                {/* Glow Effects for Featured Card */}
                {plan.featured && (
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-accent to-accent-2 rounded-card -z-10 blur-sm opacity-20" />
                )}

                <div>
                  {/* Eyebrow & Name */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="font-data text-[10px] tracking-wider uppercase font-semibold text-accent">
                        {plan.eyebrow}
                      </span>
                      <h3 className="text-2xl font-bold font-display mt-1 text-text-primary">{plan.name}</h3>
                    </div>
                    {plan.featured && (
                      <span className="text-[10px] font-data font-bold bg-accent/15 text-accent border border-accent/25 px-2 py-0.5 rounded-full uppercase">
                        POPULAR
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-data text-4xl sm:text-5xl font-extrabold text-text-primary">
                        {plan.price === 0 ? 'Free' : `₹${displayPrice.toLocaleString('en-IN')}`}
                      </span>
                      <span className="font-data text-xs text-text-muted">
                        {plan.price === 0 ? '' : `/mo`}
                      </span>
                    </div>
                    {plan.price > 0 && (
                      <span className="font-data text-[10px] text-text-muted mt-1 block">
                        ~${displayUsd}/mo equivalent
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-text-secondary leading-relaxed mb-8">
                    {plan.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-border/60 mb-8" />

                  {/* Feature Checklist */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-text-secondary leading-relaxed">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call To Action */}
                <button
                  className={`w-full py-3 h-auto text-center rounded-button font-semibold text-sm transition-all duration-150 cursor-pointer ${
                    plan.featured
                      ? 'bg-accent border border-accent text-accent-contrast shadow-sm hover:border-accent-2 hover:bg-accent-2'
                      : 'bg-surface-2 border border-border text-text-primary shadow-xs hover:border-border-strong hover:bg-surface-3'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </div>
  );
};

export default PricingPage;
