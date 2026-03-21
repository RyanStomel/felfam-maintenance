import { Building2, MessageSquare, ShieldCheck, XCircle } from 'lucide-react'

export const metadata = {
  title: 'SMS Consent & Opt-In | FelFam Maintenance',
  description:
    'How vendors and maintenance staff opt in to SMS notifications from FelFam Maintenance.',
}

export default function SmsConsentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-navy flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">FelFam Maintenance</h1>
            <p className="text-sm text-gray-500">SMS Notification Consent &amp; Opt-In</p>
          </div>
        </div>

        {/* How opt-in works */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-navy" />
            <h2 className="text-lg font-semibold text-gray-900">How SMS Opt-In Works</h2>
          </div>
          <p className="text-sm text-gray-700">
            FelFam Maintenance sends SMS text messages to vendors and maintenance staff to keep
            them informed about work orders. Opt-in is handled by a property manager inside the
            app at{' '}
            <span className="font-medium text-navy">maintenance.pigjet.com/settings</span> when
            adding or editing a vendor&nbsp;/ assignee record.
          </p>
          <p className="text-sm text-gray-700">
            Before enabling SMS notifications for any contact, the administrator must check the
            following consent checkbox on that person&apos;s vendor profile:
          </p>
          <blockquote className="border-l-4 border-navy pl-4 py-2 bg-gray-50 rounded-r-lg text-sm text-gray-800 italic">
            &ldquo;I confirm this person has provided express written consent to receive SMS
            notifications from FelFam / PigJet regarding maintenance requests. Message &amp; data
            rates may apply. They may reply STOP at any time to unsubscribe.&rdquo;
          </blockquote>
          <p className="text-sm text-gray-700">
            SMS notifications are <strong>not</strong> enabled for any contact until this box is
            explicitly checked by an administrator.
          </p>
        </section>

        {/* Message types */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-navy" />
            <h2 className="text-lg font-semibold text-gray-900">Types of SMS Messages Sent</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            <li>New maintenance request assigned to you</li>
            <li>Work log update added to a request</li>
            <li>Status change on a request (e.g., In Progress → Completed)</li>
            <li>Broadcast updates on all active requests (for managers opted in to global alerts)</li>
          </ul>
          <p className="text-sm text-gray-500">
            Message frequency varies by maintenance activity. Standard message &amp; data rates
            may apply.
          </p>
        </section>

        {/* Opt-out */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">How to Opt Out</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            <li>
              <strong>Reply STOP</strong> to any SMS from FelFam Maintenance to immediately
              unsubscribe.
            </li>
            <li>
              Contact your property manager and ask them to disable SMS on your vendor record at{' '}
              <span className="font-medium">maintenance.pigjet.com/settings</span>.
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Questions?</h2>
          <p className="text-sm text-gray-700">
            Contact FelFam Property Management at{' '}
            <a href="mailto:ryan@felfam.com" className="text-navy underline">
              ryan@felfam.com
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-center text-gray-400">
          © {new Date().getFullYear()} FelFam / PigJet. All rights reserved.
        </p>
      </div>
    </div>
  )
}
