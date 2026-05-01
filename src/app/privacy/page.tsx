import { Building2 } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | FelFam Maintenance',
  description: 'Privacy Policy for FelFam Maintenance — how we collect, use, and protect your information.',
}

export default function PrivacyPolicyPage() {
  const effectiveDate = 'March 27, 2025'

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-navy flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">FelFam Maintenance</h1>
            <p className="text-sm text-gray-500">Privacy Policy</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
          <p className="text-xs text-gray-400">Effective Date: {effectiveDate}</p>

          {/* 1. Introduction */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">1. Introduction</h2>
            <p>
              FelFam Property Management (&ldquo;FelFam,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              operates the FelFam Maintenance platform, accessible at{' '}
              <strong>maintenance.pigjet.com</strong>. This Privacy Policy explains how we
              collect, use, disclose, and safeguard information about the vendors, maintenance
              staff, and property managers (&ldquo;users&rdquo;) who interact with our platform,
              including via SMS text message communications.
            </p>
            <p>
              By using our platform or consenting to receive SMS communications from us, you
              agree to the practices described in this Privacy Policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Contact Information:</strong> Name, phone number, and email address
                provided when a vendor or staff member is added to the platform.
              </li>
              <li>
                <strong>SMS Consent Records:</strong> Whether a contact has provided express
                written consent to receive SMS notifications, including the date and time consent
                was recorded, and the administrator who recorded it.
              </li>
              <li>
                <strong>Work Order Data:</strong> Information related to maintenance requests,
                including property address, issue description, status updates, and work logs.
              </li>
              <li>
                <strong>SMS Interaction Data:</strong> Delivery receipts, opt-out (STOP) events,
                and message history associated with your phone number.
              </li>
              <li>
                <strong>Device &amp; Usage Data:</strong> IP address, browser type, and basic
                analytics when you access the platform.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Send SMS notifications about maintenance work orders you are assigned to or responsible for.</li>
              <li>Manage and track maintenance requests, work logs, and status changes.</li>
              <li>Honor opt-out requests and maintain suppression lists.</li>
              <li>Communicate with vendors and staff regarding property maintenance activities.</li>
              <li>Comply with legal obligations and enforce our terms.</li>
            </ul>
            <p>
              We do <strong>not</strong> use your information for marketing, advertising, or
              any purpose unrelated to property maintenance operations.
            </p>
          </section>

          {/* 4. SMS Communications */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">4. SMS Communications</h2>
            <p>
              We send SMS messages only to individuals who have provided express written consent
              through the opt-in process described at{' '}
              <a href="/sms-consent" className="text-navy underline">
                maintenance.pigjet.com/sms-consent
              </a>
              .
            </p>
            <p>Types of SMS messages we send include:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>New maintenance request assignments</li>
              <li>Work log and status updates</li>
              <li>Operational alerts related to active work orders</li>
            </ul>
            <p>
              <strong>Message frequency</strong> varies based on maintenance activity.{' '}
              <strong>Message and data rates may apply.</strong>
            </p>
            <p>
              To opt out at any time, reply <strong>STOP</strong> to any message. You may also
              contact us at{' '}
              <a href="mailto:ryan@felfam.com" className="text-navy underline">
                ryan@felfam.com
              </a>{' '}
              to request removal. After opting out, we will not send further SMS messages unless
              new express written consent is obtained.
            </p>
            <p>
              Reply <strong>HELP</strong> to any message for assistance, or email{' '}
              <a href="mailto:ryan@felfam.com" className="text-navy underline">
                ryan@felfam.com
              </a>
              .
            </p>
          </section>

          {/* 5. Sharing of Information */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">5. Sharing of Information</h2>
            <p>
              We do <strong>not</strong> sell, rent, or share your personal information with
              third parties for their marketing purposes. We may share information with:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong>Service Providers:</strong> Telnyx (SMS delivery), Supabase (database
                hosting), and Vercel (platform hosting), each bound by confidentiality
                obligations and used solely to operate the platform.
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law, subpoena, or to protect
                our rights and the safety of others.
              </li>
            </ul>
            <p>
              No mobile information will be shared with third parties or affiliates for marketing
              or promotional purposes. All other categories exclude text messaging originator
              opt-in data and consent; this information will not be shared with any third parties.
            </p>
          </section>

          {/* 6. Data Retention */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">6. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to fulfill the purposes
              described in this policy, or as required by applicable law. SMS consent records
              and opt-out events are retained for a minimum of five (5) years to comply with
              telecommunications regulations.
            </p>
          </section>

          {/* 7. Data Security */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">7. Data Security</h2>
            <p>
              We implement reasonable technical and organizational measures to protect your
              information from unauthorized access, disclosure, or loss. This includes
              encrypted data storage, access controls, and secure communication channels.
              However, no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Request access to the personal information we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your information, subject to legal retention requirements.</li>
              <li>Opt out of SMS communications at any time by replying STOP.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:ryan@felfam.com" className="text-navy underline">
                ryan@felfam.com
              </a>
              .
            </p>
          </section>

          {/* 9. Children */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">9. Children&apos;s Privacy</h2>
            <p>
              Our platform is intended for use by adults in a professional capacity. We do not
              knowingly collect information from individuals under the age of 18.
            </p>
          </section>

          {/* 10. Changes */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated
              policy on this page with a revised effective date. Continued use of the platform
              or SMS services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 11. Contact */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-900">11. Contact Us</h2>
            <p>
              For questions or concerns about this Privacy Policy or our data practices, contact:
            </p>
            <address className="not-italic space-y-1 pl-2 text-gray-700">
              <p><strong>FelFam Property Management</strong></p>
              <p>25418 Cumberland Ln., Calabasas, CA 91302</p>
              <p>
                Email:{' '}
                <a href="mailto:ryan@felfam.com" className="text-navy underline">
                  ryan@felfam.com
                </a>
              </p>
            </address>
          </section>
        </div>

        <p className="text-xs text-center text-gray-400">
          © {new Date().getFullYear()} FelFam Property Management. All rights reserved.
        </p>
      </div>
    </div>
  )
}
