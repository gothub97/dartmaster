"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center transform group-hover:scale-110 transition">
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              </div>
              <span className="font-bold text-xl text-gray-900">Dartmaster</span>
            </Link>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Dartmaster ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our online 
                darts gaming platform.
              </p>
              <p className="text-gray-700 mb-4">
                By using Dartmaster, you consent to the data practices described in this policy. If you do not 
                agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">Personal Information</h3>
              <p className="text-gray-700 mb-4">When you create an account, we collect:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Name and username</li>
                <li>Email address</li>
                <li>Profile picture (if provided)</li>
                <li>Country and club information (optional)</li>
                <li>Authentication data from third-party providers (e.g., Google OAuth)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">Game Data</h3>
              <p className="text-gray-700 mb-4">We automatically collect gameplay information including:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Game statistics and scores</li>
                <li>Match history and results</li>
                <li>Practice session data</li>
                <li>Achievements and badges earned</li>
                <li>Challenge participation</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">Technical Information</h3>
              <p className="text-gray-700 mb-4">We collect certain technical data including:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Operating system</li>
                <li>Time zone settings</li>
                <li>Usage patterns and preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide and maintain the Service</li>
                <li>Create and manage your account</li>
                <li>Process and track your game statistics</li>
                <li>Match you with other players</li>
                <li>Send notifications about game activities</li>
                <li>Respond to your comments and questions</li>
                <li>Improve and optimize the Service</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We may share your information in the following situations:</p>
              
              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">With Other Players</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your username and profile picture are visible to other players</li>
                <li>Your game statistics and achievements may be displayed on leaderboards</li>
                <li>Match results are visible to participants</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">With Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We may share information with third-party service providers who help us operate the Service, 
                including hosting providers, analytics services, and email services.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose information if required by law or in response to valid requests by public authorities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Storage and Security</h2>
              <p className="text-gray-700 mb-4">
                We use industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information</li>
                <li>Secure cloud storage infrastructure (Appwrite)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect 
                your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Object to certain uses of your information</li>
                <li>Withdraw consent for data processing</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-gray-700 mb-4">
                To exercise these rights, please contact us at support@dartmaster.app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Dartmaster is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you become aware that a child has provided us 
                with personal information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns</li>
                <li>Improve the Service</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You can control cookie settings through your browser. Disabling cookies may limit some features 
                of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                We use the following third-party services that may collect information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Appwrite:</strong> Backend infrastructure and authentication</li>
                <li><strong>Google OAuth:</strong> Authentication services</li>
                <li><strong>Vercel:</strong> Hosting and analytics</li>
              </ul>
              <p className="text-gray-700 mb-4">
                These services have their own privacy policies governing the use of your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your country of 
                residence. These countries may have different data protection laws. By using the Service, you 
                consent to such transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as your account is active or as needed to provide the Service. 
                Game statistics and historical data may be retained for leaderboard and achievement purposes even 
                after account deletion, but will be anonymized.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new policy on this page and updating the "Last updated" date. For material changes, we will 
                provide additional notice via email or through the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                <p className="font-semibold">Dartmaster Privacy Team</p>
                <p>Email: privacy@dartmaster.app</p>
                <p>Support: support@dartmaster.app</p>
                <p>Website: https://dartmaster.app</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                This Privacy Policy is effective as of the date stated above and will remain in effect except with 
                respect to any changes in its provisions in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}