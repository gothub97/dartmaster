"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using Dartmaster ("the Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you do not agree to all the terms and conditions, you may not access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Dartmaster is an online darts game platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Play various dart game modes online</li>
                <li>Track statistics and progress</li>
                <li>Compete with other players</li>
                <li>Participate in challenges and tournaments</li>
                <li>Create and manage player profiles</li>
                <li>Earn badges and achievements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly notify us of any unauthorized use</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not create multiple accounts for deceptive purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
              <p className="text-gray-700 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use cheats, exploits, or unauthorized modifications</li>
                <li>Impersonate any person or entity</li>
                <li>Share inappropriate or offensive content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Fair Play Policy</h2>
              <p className="text-gray-700 mb-4">
                We are committed to maintaining a fair gaming environment. Any form of cheating, including but not 
                limited to score manipulation, use of automated tools, or exploitation of bugs, will result in 
                immediate account suspension or termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Content and Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service and its original content, features, and functionality are owned by Dartmaster and are 
                protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 mb-4">
                By posting content on the Service, you grant us a non-exclusive, worldwide, royalty-free license 
                to use, modify, and display such content in connection with the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your use of the Service is also governed by our{' '}
                <Link href="/privacy" className="text-orange-600 hover:text-orange-700 underline">
                  Privacy Policy
                </Link>
                , which describes how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>
              <p className="text-gray-700 mb-4">
                The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service 
                will be uninterrupted, secure, or error-free. We are not liable for any indirect, incidental, special, 
                or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Account Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms 
                or for any other reason at our sole discretion. You may also delete your account at any time through 
                the account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Modifications to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes 
                via email or through the Service. Continued use of the Service after changes constitutes acceptance 
                of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in 
                which Dartmaster operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                <p className="font-semibold">Dartmaster Support</p>
                <p>Email: support@dartmaster.app</p>
                <p>Website: https://dartmaster.app</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                By using Dartmaster, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}