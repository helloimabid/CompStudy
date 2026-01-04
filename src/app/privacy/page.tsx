export default function PrivacyPolicyPage() {
  return (
    <main className="relative min-h-screen py-20 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/50">
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-zinc-500 text-sm mb-8">
            Last updated: January 4, 2026
          </p>

          <div className="prose prose-invert prose-zinc max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Welcome to CompStudy ("we," "our," or "us"). We are committed to
                protecting your personal information and your right to privacy.
                This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our website and services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">
                2.1 Information You Provide
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We collect information that you voluntarily provide when you:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Create an account (username, email address, password)</li>
                <li>Update your profile (profile picture, bio)</li>
                <li>Use our study timer and tracking features</li>
                <li>Participate in study rooms</li>
                <li>Contact us for support</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">
                2.2 Information Collected Automatically
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                When you access our services, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Study session data (duration, timestamps, goals)</li>
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, features used)</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">
                2.3 Information from Third Parties
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                If you authenticate via Google OAuth, we receive:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Your name and email address</li>
                <li>Profile picture (if public)</li>
                <li>Google account ID</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Create and manage your account</li>
                <li>Track your study progress and statistics</li>
                <li>Display you on leaderboards (username and stats only)</li>
                <li>Send you verification emails and important updates</li>
                <li>Respond to your comments and questions</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                4. Information Sharing and Disclosure
              </h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">
                4.1 Public Information
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                The following information is publicly visible:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Username</li>
                <li>Profile picture (if uploaded)</li>
                <li>Bio (if provided)</li>
                <li>Study statistics (total hours, streak, XP, rank)</li>
                <li>Current study status (when in public rooms)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">
                4.2 Service Providers
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We share information with third-party service providers:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Appwrite (authentication and database hosting)</li>
                <li>Cloudflare (content delivery and security)</li>
                <li>Analytics providers (usage tracking)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">
                4.3 Legal Requirements
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We may disclose your information if required by law, court order,
                or to protect our rights and safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                5. Data Security
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We implement appropriate security measures to protect your
                information:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Encryption in transit (HTTPS/SSL)</li>
                <li>Encrypted password storage</li>
                <li>Secure authentication via Appwrite</li>
                <li>Regular security audits</li>
                <li>Access controls and monitoring</li>
              </ul>
              <p className="text-zinc-400 leading-relaxed mb-4">
                However, no method of transmission over the internet is 100%
                secure. While we strive to protect your information, we cannot
                guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                6. Your Privacy Rights
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>
                  <strong className="text-white">Access:</strong> Request a copy
                  of your personal data
                </li>
                <li>
                  <strong className="text-white">Correction:</strong> Update or
                  correct your information
                </li>
                <li>
                  <strong className="text-white">Deletion:</strong> Request
                  deletion of your account and data
                </li>
                <li>
                  <strong className="text-white">Portability:</strong> Receive
                  your data in a portable format
                </li>
                <li>
                  <strong className="text-white">Opt-out:</strong> Unsubscribe
                  from marketing communications
                </li>
              </ul>
              <p className="text-zinc-400 leading-relaxed mb-4">
                To exercise these rights, contact us at{" "}
                <a
                  href="mailto:privacy@compstudy.tech"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  privacy@compstudy.tech
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                7. Data Retention
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We retain your information for as long as your account is active
                or as needed to provide services. When you delete your account:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Your profile and personal data are permanently deleted</li>
                <li>Study session data is anonymized</li>
                <li>Public contributions may remain anonymized</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Our services are not intended for children under 13 years of age.
                We do not knowingly collect information from children under 13. If
                we learn we have collected such information, we will delete it
                immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                9. Cookies and Tracking
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage</li>
                <li>Improve site performance</li>
              </ul>
              <p className="text-zinc-400 leading-relaxed mb-4">
                You can control cookies through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                10. International Data Transfers
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries
                other than your own. We ensure appropriate safeguards are in place
                to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                11. Changes to This Policy
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by:
              </p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2 ml-4 mb-4">
                <li>Posting the new policy on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending you an email notification (for material changes)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">
                12. Contact Us
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our privacy
                practices, contact us at:
              </p>
              <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mb-4">
                <p className="text-white mb-2">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@compstudy.tech"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    privacy@compstudy.tech
                  </a>
                </p>
                <p className="text-white mb-2">
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://compstudy.tech"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    https://compstudy.tech
                  </a>
                </p>
                <p className="text-white">
                  <strong>Support:</strong>{" "}
                  <a
                    href="mailto:support@compstudy.tech"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    support@compstudy.tech
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
