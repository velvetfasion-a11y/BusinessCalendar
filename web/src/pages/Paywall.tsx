import { useState } from 'react'

export function Paywall({ onClose }: { onClose: () => void }) {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly')

  return (
    <div className="paywall">
      <button type="button" className="close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      <div className="paywall-hero">
        <div className="crown">♛</div>
        <div className="paywall-kicker">— ACHIEVE PRO —</div>
        <h1>
          Unfold your
          <br />
          full potential
        </h1>
        <p className="sub">
          Unlimited coaching, deeper insight, and the version of you that
          doesn&apos;t keep starting over.
        </p>
      </div>

      <div className="feature-card">
        <div className="feature-row">
          <div className="feature-ico">∞</div>
          <div>
            <strong>Unlimited AI Coach</strong>
            <span>No daily caps. Talk it through whenever you need to.</span>
          </div>
        </div>
        <div className="feature-row">
          <div className="feature-ico">☰</div>
          <div>
            <strong>Unlimited Habits</strong>
            <span>Free accounts are capped at 10 habits — Pro has no limit.</span>
          </div>
        </div>
        <div className="feature-row">
          <div className="feature-ico">◐</div>
          <div>
            <strong>Premium Color Themes</strong>
            <span>
              Gold Dark, Rose Gold, and Rose Dark — luxury palettes for the
              whole app.
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`plan-card ${plan === 'yearly' ? 'on' : ''}`}
        onClick={() => setPlan('yearly')}
      >
        <span className="radio">
          <i />
        </span>
        <div className="meta">
          <strong>
            Yearly <span className="save-badge">SAVE 21%</span>
          </strong>
          <p>Billed annually at $284.99 · $23.75/mo</p>
        </div>
        <div className="price">
          $284.99
          <small>/year</small>
        </div>
      </button>

      <button
        type="button"
        className={`plan-card ${plan === 'monthly' ? 'on' : ''}`}
        onClick={() => setPlan('monthly')}
      >
        <span className="radio">
          <i />
        </span>
        <div className="meta">
          <strong>Monthly</strong>
          <p>Billed every month. Cancel anytime.</p>
        </div>
        <div className="price">
          $29.99
          <small>/month</small>
        </div>
      </button>

      <button type="button" className="primary-cta" onClick={onClose}>
        Continue · {plan === 'yearly' ? '$284.99' : '$29.99'} →
      </button>

      <p className="legal">
        Cancel anytime in Settings. Subscription auto-renews until cancelled.
        <br />
        <a href="#">Restore App Store Purchases</a>
        <a href="#">Terms</a>
        <a href="#">Privacy</a>
      </p>
    </div>
  )
}
