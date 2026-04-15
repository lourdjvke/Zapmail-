import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Zap, Shield, Crown } from "lucide-react";
import { usePaystackPayment } from 'react-paystack';
import { useFirebaseData, useAuth } from "../lib/store";

const PaymentButton = ({ tier, amount, children, className, disabled, onUpgrade }: { tier: string, amount: number, children: React.ReactNode, className: string, disabled: boolean, onUpgrade: (tier: string) => void }) => {
  const { user } = useAuth();
  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "user@example.com",
    publicKey: 'pk_test_d7fa6425a02f6759393bb876e9c34aa1bcb3ecf6',
    amount: amount * 100,
  };
  const initializePayment = usePaystackPayment(config);
  return (
    <button
      disabled={disabled}
      className={className}
      onClick={() => {
        if (!user) {
          alert("Please sign in to upgrade.");
          return;
        }
        initializePayment({
          onSuccess: (ref: any) => onUpgrade(tier),
          onClose: () => {}
        });
      }}
    >
      {children}
    </button>
  );
};

export function PricingTab() {
  const { user } = useAuth();
  const { data: currentTier, saveData: setTier } = useFirebaseData<string>('tier', 'tier_1');
  const [isProcessing, setIsProcessing] = useState(false);

  // Discount logic: valid until April 30th, 2026
  const discountEndDate = new Date('2026-04-30T23:59:59');
  const isDiscountActive = new Date() <= discountEndDate;

  const getTierPrice = (baseAmount: number, discountedAmount: number) => {
    return isDiscountActive ? discountedAmount : baseAmount;
  };

  const handleUpgrade = (tier: string) => {
    setTier(tier);
    setIsProcessing(false);
    alert(`Successfully upgraded to ${tier === 'tier_2' ? 'Tier 2' : 'Tier 3'}!`);
  };

  const tiers = [
    {
      id: "tier_1",
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
      buttonText: currentTier === "tier_1" ? "Current Plan" : "Downgrade",
      buttonClass: currentTier === "tier_1" ? "bg-gray-100 text-gray-500 cursor-default" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      highlight: false,
      action: () => currentTier !== "tier_1" && setTier("tier_1")
    },
    {
      id: "tier_2",
      name: "Tier 2",
      subtitle: "Professional",
      price: getTierPrice(7000, 5500).toLocaleString(),
      currency: "NGN",
      period: "per month",
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      features: [
        "Up to 250 messages per blast",
        "Up to 800 messages per day",
        "Firebase extraction (up to 250)",
        "Access to everyone's templates",
        "Access to scheduling emails",
        "Advanced reporting"
      ],
      buttonText: currentTier === "tier_2" ? "Current Plan" : (currentTier === "tier_3" ? "Downgrade" : "Upgrade to Tier 2"),
      buttonClass: currentTier === "tier_2" ? "bg-gray-100 text-gray-500 cursor-default" : "bg-brand-dark text-white hover:bg-brand-dark/90",
      highlight: true,
      action: () => currentTier !== "tier_2" && (currentTier === "tier_3" ? setTier("tier_2") : null),
      isPayment: currentTier !== "tier_2" && currentTier !== "tier_3",
      amount: getTierPrice(7000, 5500),
      originalAmount: 7000
    },
    {
      id: "tier_3",
      name: "Tier 3",
      subtitle: "Enterprise",
      price: getTierPrice(12000, 10500).toLocaleString(),
      currency: "NGN",
      period: "per month",
      icon: <Crown className="w-6 h-6 text-amber-500" />,
      features: [
        "Up to 1,000 messages per blast",
        "Up to 1,500 messages per day",
        "Set up recurring emails",
        "Spam prevention",
        "Unlimited Firebase extraction",
        "Access to experimental features"
      ],
      extraNote: "Works best with google workspace",
      buttonText: currentTier === "tier_3" ? "Current Plan" : "Upgrade to Tier 3",
      buttonClass: currentTier === "tier_3" ? "bg-gray-100 text-gray-500 cursor-default" : "bg-amber-500 text-white hover:bg-amber-600",
      highlight: false,
      action: () => currentTier !== "tier_3" && null,
      isPayment: currentTier !== "tier_3",
      amount: getTierPrice(12000, 10500),
      originalAmount: 12000
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
              <div className="flex items-baseline gap-1 flex-wrap">
                {tier.currency && <span className="text-lg font-semibold text-gray-900">{tier.currency}</span>}
                {isDiscountActive && tier.originalAmount && (
                  <span className="text-xl text-gray-400 line-through mr-1">
                    {tier.originalAmount.toLocaleString()}
                  </span>
                )}
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-500">/{tier.period}</span>
              </div>
              {isDiscountActive && tier.originalAmount && (
                <div className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                  Limited Time Offer - Ends April 30
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {tier.extraNote && (
                <div className="text-sm text-emerald-600 font-medium mb-2">
                  {tier.extraNote}
                </div>
              )}
              {tier.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {tier.isPayment ? (
              <PaymentButton
                tier={tier.id}
                amount={tier.amount || 0}
                disabled={isProcessing || currentTier === tier.id}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${tier.buttonClass} disabled:opacity-70`}
                onUpgrade={handleUpgrade}
              >
                {isProcessing && currentTier !== tier.id ? "Processing..." : tier.buttonText}
              </PaymentButton>
            ) : (
              <button 
                onClick={tier.action}
                disabled={isProcessing || currentTier === tier.id}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${tier.buttonClass} disabled:opacity-70`}
              >
                {isProcessing && currentTier !== tier.id ? "Processing..." : tier.buttonText}
              </button>
            )}
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
