import React from "react";
import { motion } from "motion/react";
import { Shield, Lock, Mail, Server, EyeOff, CheckCircle2 } from "lucide-react";

export function PrivacyPolicy() {
  const lastUpdated = "April 13, 2026";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Shield className="w-4 h-4" />
              Privacy First
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              At Zapmail, we believe your data belongs to you. We've built our architecture to ensure maximum security and minimal data retention.
            </p>
            <div className="mt-8 text-sm text-slate-400">
              Last Updated: {lastUpdated}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid gap-12">
          
          {/* Core Philosophy */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Lock className="w-6 h-6 text-emerald-500" />
              Our Core Philosophy
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Zapmail is designed to be a transparent bridge between you and your audience. We do not retain any data except User Generated Content (UGC) and data generated specifically within or for the Zapmail platform.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {[
                "No Inbox Interception",
                "No Email Retention",
                "Secure App Script Bridge",
                "Minimal Data Footprint"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Access & Security */}
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Mail className="w-6 h-6 text-emerald-500" />
                Email Access & Security
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Zapmail <strong>does not and cannot</strong> intercept your personal emails or access your inbox. Our system operates through a secure Google App Script bridge. This means:
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">1</div>
                  <p className="text-slate-600"><span className="font-bold text-slate-900">Direct Delivery:</span> Your emails are sent directly from your Gmail account via the Google API. They never pass through or reside on our servers during the sending process.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</div>
                  <p className="text-slate-600"><span className="font-bold text-slate-900">No Inbox Access:</span> We do not request, nor do we have, the permissions required to read your incoming emails or search your inbox history.</p>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-900 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <Server className="w-6 h-6 text-emerald-400" />
                What We Store
              </h3>
              <p className="text-emerald-100/80 leading-relaxed mb-6">
                To provide our services, we only store the following essential data points in our secure database:
              </p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  "Your Email Address",
                  "Username & Gmail Profile Photo",
                  "Zapmail Drafts & Templates",
                  "Broadcast Lists (UGC)",
                  "Analytics (Sent/Failed counts)"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Data Sovereignty */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <EyeOff className="w-6 h-6 text-emerald-500" />
              Data Sovereignty
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Your data never touches our database except for the specific items listed above. We do not sell, rent, or share your data with third parties. All tracking data (such as the amount of emails sent) is used solely to provide you with analytics within your dashboard.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-slate-200 pt-12 text-center">
            <p className="text-slate-500 text-sm">
              If you have any questions about this Privacy Policy, please contact us through our official support channels.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-emerald-600 font-bold text-xl mb-4">Zapmail</div>
          <p className="text-slate-400 text-xs">
            © {new Date().getFullYear()} Zapmail. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
