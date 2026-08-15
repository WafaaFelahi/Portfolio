import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Mail, MapPin, Send } from 'lucide-react';
import { PROFILE } from '../data';

export default function Contact() {
  const titleRef = useRef(null);
  const inView = useInView(titleRef, { once: true });
  const reduced = useReducedMotion();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
    const mailto = `mailto:${PROFILE.email}?subject=Portfolio Enquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(`From: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailto;
    setSent(true);
  };

  return (
    <section
      id="contact"
      className="section-base relative py-32 px-4 md:px-8"
      aria-label="Contact Wafa Felahi"
    >
      {/* Still-water reflection gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(42,63,126,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(123,167,212,0.04) 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          ref={titleRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: reduced ? 0 : 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs tracking-[0.4em] text-[var(--color-lotus-blue)] uppercase font-body mb-4">
            Chapter VI
          </p>
          <h2 className="font-display text-5xl md:text-6xl text-gradient font-light mb-4">
            Reach the Shore
          </h2>
          <p className="text-[var(--color-moon-silver)] opacity-55 max-w-md mx-auto text-sm font-body leading-relaxed">
            The lotus blooms where the water is still.
            Send a message — I'll find it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Social links */}
          <motion.div
            className="flex flex-col gap-5"
            initial={{ opacity: 0, x: reduced ? 0 : -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-display text-xl text-[var(--color-moon-white)] mb-4">Find me</h3>

              <a
                href={`mailto:${PROFILE.email}`}
                className="flex items-center gap-3 text-sm text-[var(--color-moon-silver)] hover:text-[var(--color-lotus-blue)] transition-colors duration-300 font-body group"
                aria-label="Send email to Wafa"
              >
                <Mail size={16} className="text-[var(--color-lotus-mist)] group-hover:text-[var(--color-lotus-blue)] transition-colors" />
                {PROFILE.email}
              </a>

              <a
                href={PROFILE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-[var(--color-moon-silver)] hover:text-[var(--color-lotus-blue)] transition-colors duration-300 font-body group"
                aria-label="Wafa's LinkedIn profile"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-lotus-mist)] group-hover:text-[var(--color-lotus-blue)] transition-colors"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                linkedin.com/in/wafa-felahi
              </a>

              <a
                href={PROFILE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-[var(--color-moon-silver)] hover:text-[var(--color-lotus-blue)] transition-colors duration-300 font-body group"
                aria-label="Wafa's GitHub profile"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-lotus-mist)] group-hover:text-[var(--color-lotus-blue)] transition-colors"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.24c3-.3 6-1.5 6-6.38 0-1.4-.5-2.5-1.3-3.3.1-.3.6-1.6-.1-3.3 0 0-1.1-.3-3.4 1.5a11.5 11.5 0 0 0-6 0C6.3 3.1 5.2 3.4 5.2 3.4c-.7 1.7-.2 3 .1 3.3-.8.8-1.3 1.9-1.3 3.3 0 4.88 3 6.08 6 6.38a4.8 4.8 0 0 0-1 3.24v4"></path><path d="M12 18g-3.2 1.3-4.5-1.7"></path></svg>
                github.com/WafaQueen1
              </a>

              <div className="flex items-center gap-3 text-sm text-[var(--color-moon-silver)] opacity-50 font-body">
                <MapPin size={16} className="text-[var(--color-lotus-mist)]" />
                {PROFILE.location}
              </div>
            </div>

            {/* Certifications */}
            <div className="glass-card p-6">
              <h3 className="font-display text-lg text-[var(--color-moon-white)] mb-4">Certifications</h3>
              <div className="space-y-3">
                {[
                  { label: 'AWS Certified Cloud Practitioner', year: '2023', icon: '☁️' },
                  { label: 'AWS Certified Generative AI Specialist', year: '2023', icon: '🤖' },
                ].map(cert => (
                  <div key={cert.label} className="flex items-start gap-3">
                    <span className="text-base shrink-0">{cert.icon}</span>
                    <div>
                      <p className="text-xs text-[var(--color-moon-silver)] font-body leading-snug">{cert.label}</p>
                      <p className="text-xs text-[var(--color-lotus-mist)] font-body opacity-60">{cert.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: reduced ? 0 : 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            {sent ? (
              <div className="glass-card p-8 flex flex-col items-center justify-center h-full text-center gap-4">
                <span className="text-4xl">🌕</span>
                <h3 className="font-display text-2xl text-[var(--color-moon-white)]">Message sent.</h3>
                <p className="text-sm text-[var(--color-moon-silver)] opacity-60 font-body">
                  Your mail client should have opened. I'll respond as soon as the moon rises.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="glass-card p-8 flex flex-col gap-5"
                aria-label="Contact form"
              >
                <div>
                  <label className="block text-xs tracking-widest text-[var(--color-lotus-mist)] uppercase font-body mb-2" htmlFor="contact-name">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Your name"
                    className="lunossa-input"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-[var(--color-lotus-mist)] uppercase font-body mb-2" htmlFor="contact-email">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="lunossa-input"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-[var(--color-lotus-mist)] uppercase font-body mb-2" htmlFor="contact-message">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    placeholder="Tell me about your project or idea..."
                    rows={5}
                    className="lunossa-input resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-body font-medium transition-all duration-300 group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(42,63,126,0.7) 0%, rgba(74,123,168,0.5) 100%)',
                    border: '1px solid rgba(123,167,212,0.35)',
                    color: 'var(--color-moon-white)',
                  }}
                >
                  <Send size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          className="text-center mt-20 text-xs text-[var(--color-moon-silver)] opacity-25 font-body tracking-widest"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.25 } : { opacity: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          Lunossa · {new Date().getFullYear()} · Wafa Felahi
        </motion.p>
      </div>
    </section>
  );
}
