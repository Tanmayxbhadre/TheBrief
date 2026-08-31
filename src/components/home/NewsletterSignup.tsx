'use client';

import { useState } from 'react';
import styles from './NewsletterSignup.module.css';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    // TODO: Connect to Mailchimp / Resend / ConvertKit
    setStatus('success');
    setEmail('');
  };

  return (
    <section className={styles.section} aria-label="Newsletter signup">
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <h2 className={styles.heading}>The Brief, Daily.</h2>
          <p className={styles.subtext}>
            Get the most important stories of the day delivered to your inbox every morning.
            No noise, no spam.
          </p>
        </div>

        {status === 'success' ? (
          <div className={styles.successMsg} role="status">
            <span>✓</span>
            <p>You&apos;re subscribed. Check your inbox for a confirmation email.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputGroup}>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className={`${styles.input} ${status === 'error' ? styles.inputError : ''}`}
                aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                required
              />
              <button type="submit" className={styles.btn}>Subscribe</button>
            </div>
            {status === 'error' && (
              <p id="newsletter-error" className={styles.error} role="alert">
                Please enter a valid email address.
              </p>
            )}
            <p className={styles.privacy}>
              No spam. Unsubscribe anytime. See our{' '}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
