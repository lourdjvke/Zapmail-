import React from "react";
import { motion } from "motion/react";
import { FileText, Zap, Eye, Database, Edit3, ShieldCheck } from "lucide-react";

export function TermsOfService() {
  const lastUpdated = "April 15, 2026";

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
              <FileText className="w-4 h-4" />
              Legal
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Please read these terms carefully. By using Zapmail, you agree to these conditions.
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
          
          {/* Automation & Tracking */}
          <section className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-emerald-500" />
              Platform Functionality
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              By using the Zapmail platform, you authorize us to trigger Google events to automate your email sending processes. Furthermore, you acknowledge and consent to our use of pixel tracking technology within your emails to provide you with analytics on open rates and engagement.
            </p>
          </section>

          {/* UGC Ownership */}
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Edit3 className="w-6 h-6 text-emerald-500" />
                User-Generated Content (UGC)
              </h2>
              <p className="text-slate-600 leading-relaxed">
                You retain the right to edit your User-Generated Content (UGC), such as mailing templates, at any time. However, by creating and using templates on the Zapmail platform, you grant us full ownership of such UGC. This includes the irrevocable right for us to use, transfer, or share your UGC on the platform as we deem necessary.
              </p>
              <p className="text-slate-600 leading-relaxed mt-4">
                Please note that once UGC is created, deletion cannot be requested. You may modify or edit your UGC, but it will remain part of the platform's content ecosystem.
              </p>
            </div>

            {/* Data Privacy */}
            <div className="bg-emerald-900 rounded-xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-emerald-400" />
                Your Leads & Contacts
              </h3>
              <p className="text-emerald-100/80 leading-relaxed">
                We respect the privacy of your audience. Zapmail <strong>does not</strong> use, access, share, or sell your leads, contacts, or broadcast lists for any purpose other than facilitating your own email campaigns as requested by you.
              </p>
            </div>
          </section>

          {/* General Terms */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              General Provisions
            </h2>
            <p className="text-slate-600 leading-relaxed">
              These terms constitute the entire agreement between you and Zapmail regarding your use of the platform. We reserve the right to update these terms periodically. Continued use of the platform constitutes acceptance of any updated terms.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-slate-200 pt-12 text-center">
            <p className="text-slate-500 text-sm">
              If you have any questions about these Terms of Service, please contact us through our official support channels.
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
