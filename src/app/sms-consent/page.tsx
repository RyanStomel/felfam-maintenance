import { Building2, MessageSquare, ShieldCheck, XCircle, CheckCircle } from 'lucide-react'

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

        {/* Program description */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-navy" />
            <h2 className="text-lg font-semibold text-gray-900">SMS Program Description</h2>
          </div>
          <p className="text-sm text-gray-700">
            FelFam Maintenance (operated by FelFam Property Management) sends SMS text messages
            to vendors and maintenance staff to keep them informed about maintenance work orders.
            Messages are sent from <strong>+1 (747) 204-7447</strong> via Telnyx on behalf of
            FelFam Property Management.
          </p>
          <p className="text-sm text-gray-700">
            <strong>Message frequency</strong> varies based on maintenance activity.{' '}
            <strong>Message and data rates may apply.</strong>
          </p>
        </section>

        {/* How opt-in works */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">How SMS Opt-In Works</h2>
          </div>
          <p className="text-sm text-gray-700">
            Opt-in is handled by a property manager inside the app at{' '}
            <span className="font-medium text-navy">maintenance.pigjet.com/settings</span> when
            adding or editing a vendor / assignee record. Before enabling SMS notifications for
            any contact, the administrator must check the following express written consent
            checkbox on that person&apos;s vendor profile:
          </p>
          <blockquote className="border-l-4 border-navy pl-4 py-2 bg-gray-50 rounded-r-lg text-sm text-gray-800 italic">
            &ldquo;I confirm this person has provided express written consent to receive SMS
            notifications from FelFam / PigJet regarding maintenance requests. Message &amp; data
            rates may apply. They may reply STOP at any time to unsubscribe.&rdquo;
          </blockquote>
          <p className="text-sm text-gray-700">
            After the administrator enables SMS, the vendor or staff member receives a
            confirmation text message such as:
          </p>
          <blockquote className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r-lg text-sm text-gray-800">
            &ldquo;FelFam Maintenance: You have been opted in to receive work order SMS
            notifications. Msg &amp; data rates may apply. Reply STOP to unsubscribe, HELP for
            help.&rdquo;
          </blockquote>
          <p className="text-sm text-gray-700">
            SMS notifications are <strong>not</strong> enabled for any contact until the
            administrator&apos;s consent checkbox is explicitly checked. No SMS messages are sent
            to anyone who has not affirmatively opted in.
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
              unsubscribe. You will receive a confirmation that you have been removed.
            </li>
            <li>
              <strong>Reply HELP</strong> to any message for help or contact information.
            </li>
            <li>
              Contact your property manager and ask them to disable SMS on your vendor record at{' '}
              <span className="font-medium">maintenance.pigjet.com/settings</span>.
            </li>
            <li>
              Email us at{' '}
              <a href="mailto:ryan@felfam.com" className="text-navy underline">
                ryan@felfam.com
              </a>{' '}
              to request removal.
            </li>
          </ul>
        </section>

        {/* Privacy Policy */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Privacy &amp; Data Use</h2>
          <p className="text-sm text-gray-700">
            Your phone number and SMS consent status are used solely to deliver work order
            notifications. We do not share, sell, or use your mobile information for marketing
            or advertising purposes. No mobile information will be shared with third parties or
            affiliates for marketing or promotional purposes.
          </p>
          <p className="text-sm text-gray-700">
            For complete details on how we handle your information, see our{' '}
            <a href="/privacy" className="text-navy underline font-medium">
              Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Questions?</h2>
          <p className="text-sm text-gray-700">
            Contact FelFam Property Management at{' '}
            <a href="mailto:ryan@felfam.com" className="text-navy underline">
              ryan@felfam.com
            </a>{' '}
            or reply <strong>HELP</strong> to any SMS.
          </p>
          <address className="not-italic text-sm text-gray-600 pt-1">
            FelFam Property Management<br />
            25418 Cumberland Ln., Calabasas, CA 91302
          </address>
        </section>

        <p className="text-xs text-center text-gray-400">
          © {new Date().getFullYear()} FelFam Property Management. All rights reserved.{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
