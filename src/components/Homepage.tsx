import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Facebook, Instagram, Twitter, ArrowUpRight, Layers, PenTool, BarChart2, FileCheck } from 'lucide-react';

export function Homepage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ emails: 124592, leads: 8432, templates: 42 });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const usersRef = ref(db, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          let totalEmails = 0;
          let totalLeads = 0;
          
          Object.values(usersData).forEach((user: any) => {
            if (user.jobs) {
              Object.values(user.jobs).forEach((job: any) => {
                totalEmails += (job.total || 0);
              });
            }
            if (user.leads) {
              totalLeads += Object.keys(user.leads).length;
            }
          });

          setMetrics({
            emails: totalEmails > 0 ? totalEmails : 124592,
            leads: totalLeads > 0 ? totalLeads : 8432,
            templates: 42
          });
        }
      } catch (e) {
        // Silently fallback to default metrics if unauthenticated read fails
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-200">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white">
            Z
          </div>
          <span className="text-xl font-bold tracking-tight">ZapMail</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#" className="text-slate-900">Home</a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-900 hover:text-emerald-600 transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="text-sm font-medium bg-slate-800 text-white px-5 py-2.5 rounded-lg hover:bg-slate-900 transition-colors"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 text-center max-w-5xl mx-auto relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent -z-10 pointer-events-none" />
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]"
        >
          Boost your sales with<br />targeted cold email campaigns
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          Create and send personalized emails that resonate with prospects. Connect with potential customers, nurture leads, and close deals faster and more efficiently.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mx-auto max-w-4xl"
        >
          <img 
            src="https://cdn.prod.website-files.com/66c801a90927982031cf8b79/66d531619ad494dd8a25f841_Frame%202147223715%20(1).png" 
            alt="Analytics Dashboard" 
            className="w-full h-auto border border-slate-100 rounded-xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </section>

      {/* SaaS Platform Features */}
      <section id="features" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">SaaS platform, tailored for your needs</h2>
            <p className="text-slate-600 text-lg">
              Discover the ultimate SaaS platform, tailored to meet your unique needs. Experience seamless integration, intuitive design, and powerful features that adapt to your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
              { icon: <Layers className="w-6 h-6 text-emerald-600" />, title: "Plan and organize", desc: "Effective planning optimized for maximum engagement and conversion rates." },
              { icon: <PenTool className="w-6 h-6 text-emerald-600" />, title: "Create campaign", desc: "A well-crafted cold email campaign can create new chance and business growth." },
              { icon: <BarChart2 className="w-6 h-6 text-emerald-600" />, title: "Analyze data", desc: "You can gain insights into what works and make decisions to achieve better results." },
              { icon: <FileCheck className="w-6 h-6 text-emerald-600" />, title: "Evaluate campaign", desc: "Reviewing key metrics such as open rates, click-through rates, conversion rates, etc." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{feature.desc}</p>
                <button className="text-emerald-600 font-medium flex items-center gap-1 hover:text-emerald-700 transition-colors">
                  Learn more <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors">
              Learn more
            </button>
          </div>
        </div>
      </section>

      {/* Alternating Sections */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          
          {/* Section 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 w-full">
              <img 
                src="https://cdn.dribbble.com/userupload/15708067/file/original-f1a2f2902f95f897e5de90b8fdebca1c.png?resize=752x&vertical=center" 
                alt="Client Database" 
                className="w-full h-auto rounded-xl border border-slate-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <div className="text-emerald-600 font-bold text-sm tracking-wider uppercase mb-4">Client Database</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Integrate firebase database with ease</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Identify potential clients and prepare your list for targeted email campaigns. This streamlined tool ensures you have the right audience.
              </p>
              <button className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                Learn more
              </button>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 w-full">
              <img 
                src="https://cdn.dribbble.com/userupload/15707675/file/original-c96bca5f4d98b1dafa399727ed3a8008.jpg" 
                alt="Insights" 
                className="w-full h-auto rounded-xl border border-slate-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <div className="text-emerald-600 font-bold text-sm tracking-wider uppercase mb-4">Insights</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Turn data into actionable insights</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                The Zapmail Analytics page gives you a clear view of your email campaign performance. You can quickly interpret data and optimize it.
              </p>
              <button className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                Learn more
              </button>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 w-full">
              <img 
                src="https://cdn.dribbble.com/userupload/7181787/file/original-76304c5ee94218ce462d1111d3bc50f7.png?format=webp&resize=400x300&vertical=center" 
                alt="Create Email" 
                className="w-full h-auto rounded-xl border border-slate-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <div className="text-emerald-600 font-bold text-sm tracking-wider uppercase mb-4">Create Email</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Effortlessly create email campaign</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Our intuitive platform allows you to design, personalize, and launch impactful email campaigns in just a few clicks.
              </p>
              <button className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                Learn more
              </button>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 w-full">
              <img 
                src="https://cdn.dribbble.com/userupload/7181787/file/original-76304c5ee94218ce462d1111d3bc50f7.png?format=webp&resize=400x300&vertical=center" 
                alt="Launch Email" 
                className="w-full h-auto rounded-xl border border-slate-100"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <div className="text-emerald-600 font-bold text-sm tracking-wider uppercase mb-4">Launch</div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Launch effective email</h2>
              <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                Launch effective emails that capture attention and drive action. With our user-friendly tools, you can easily craft personalized messages.
              </p>
              <button className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                Learn more
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
                {metrics.emails > 1000 ? `${(metrics.emails / 1000).toFixed(1)}K+` : metrics.emails}
              </div>
              <div className="text-emerald-700 font-medium uppercase tracking-wider text-sm">Total Emails Sent</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
                {metrics.leads > 1000 ? `${(metrics.leads / 1000).toFixed(1)}K+` : metrics.leads}
              </div>
              <div className="text-emerald-700 font-medium uppercase tracking-wider text-sm">Total Leads Created</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">
                {metrics.templates}+
              </div>
              <div className="text-emerald-700 font-medium uppercase tracking-wider text-sm">Templates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-[#214F3A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Subscribe to our newsletter</h2>
              <p className="text-emerald-100/80 text-lg leading-relaxed max-w-md">
                Subscribe to our newsletter and stay ahead with the latest updates, exclusive insights, and valuable tips delivered straight to your inbox.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-emerald-100/80 text-sm mb-2">Your name</label>
                  <input 
                    type="text" 
                    placeholder="Anthony Smith"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-emerald-100/80 text-sm mb-2">Messages</label>
                  <textarea 
                    placeholder="Write your messages..."
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all resize-none"
                  />
                </div>
                <button className="bg-slate-800 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1A13] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white">
                  Z
                </div>
                <span className="text-xl font-bold tracking-tight">ZapMail</span>
              </div>
              <p className="text-emerald-100/60 text-sm mb-6 max-w-xs leading-relaxed">
                Abuja, Nigeria<br />
                support@zapmail.com
              </p>
              <div className="flex items-center gap-4">
                <a href="https://facebook.com/lourdjvke" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Facebook className="w-5 h-5 text-white" />
                </a>
                <a href="https://instagram.com/lourdjvke" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a href="https://x.com/lourdjvke" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Twitter className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Resources</h4>
              <ul className="space-y-4 text-emerald-100/60 text-sm">
                <li>Coming soon</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-emerald-100/60 text-sm">
                <li>Build by Lourd</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">Legal</h4>
              <ul className="space-y-4 text-emerald-100/60 text-sm">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-emerald-100/60 text-sm">
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
            <div>
              © {new Date().getFullYear()} Zapmail. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
