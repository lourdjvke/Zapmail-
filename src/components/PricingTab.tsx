import React from "react";
import { motion } from "motion/react";
import { Check, Zap, Shield, Crown } from "lucide-react";

export function PricingTab() {
  const tiers = [
    {
      name: "Tier 1",
      subtitle: "Default Tier",
      price: "Free",
      period: "forever",
      icon: <Zap className="w-6 h-6 text-emerald-500" />,
      features: [
        "Up to 20 emails per blast",
        "Up to 100 emails per day",
        "Access to own templates",
        "Basic analytics",
        "Community support"
      ],
      buttonText: "Current Plan",
      buttonClass: "bg-gray-100 text-gray-500 cursor-default",
      highlight: false
    },
    {
      name: "Tier 2",
      subtitle: "Professional",
      price: "7,000",
      currency: "NGN",
      period: "per month",
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      features: [
        "Up to 200 messages per blast",
        "Up to 800 messages per day",
        "Access to Firebase linking",
        "Access to template libraries",
        "Priority email support",
        "Advanced reporting"
      ],
      buttonText: "Upgrade to Tier 2",
      buttonClass: "bg-brand-dark text-white hover:bg-brand-dark/90",
      highlight: true
    },
    {
      name: "Tier 3",
      subtitle: "Enterprise",
      price: "12,000",
      currency: "NGN",
      period: "per month",
      icon: <Crown className="w-6 h-6 text-amber-500" />,
      features: [
        "Up to 500 messages per blast",
        "Up to 1,500 messages per day",
        "Everything in Tier 2",
        "Campaign creation & scheduling",
        "Dedicated account manager",
        "Custom integration support"
      ],
      buttonText: "Upgrade to Tier 3",
      buttonClass: "bg-amber-500 text-white hover:bg-amber-600",
      highlight: false
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12"
    >
      <div className="text-center text-gray-900 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Choose the plan that best fits your business needs. Scale your outreach and reach more contacts with our premium tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white rounded-3xl p-8 shadow-xl border ${
              tier.highlight ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-gray-100"
            } flex flex-col h-full`}
          >
            {tier.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                {tier.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
              <p className="text-sm text-gray-500">{tier.subtitle}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                {tier.currency && <span className="text-lg font-semibold text-gray-900">{tier.currency}</span>}
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-500">/{tier.period}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all ${tier.buttonClass}`}>
              {tier.buttonText}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bg-brand-dark rounded-3xl p-8 text-center text-white max-w-3xl mx-auto shadow-xl border border-white/10">
        <h3 className="text-xl font-semibold mb-2">Need a custom plan?</h3>
        <p className="text-emerald-100/70 text-sm mb-6">
          If your business requires even higher limits or custom integrations, contact our sales team for a tailored solution.
        </p>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-colors">
          Contact Sales Support
        </button>
      </div>
    </motion.div>
  );
}
