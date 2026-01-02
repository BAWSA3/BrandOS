export const metadata = {
  title: "Privacy Policy | BrandOS",
  description: "Privacy Policy for BrandOS",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="mb-4">When you use BrandOS, we may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address and name when you sign up</li>
              <li><strong>Social Media Data:</strong> Public profile information from X (Twitter) that you authorize us to analyze</li>
              <li><strong>Usage Data:</strong> How you interact with our service, including features used and time spent</li>
              <li><strong>Device Information:</strong> Browser type, IP address, and device identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and improve our brand analysis services</li>
              <li>To generate your Brand DNA and Brand Score</li>
              <li>To communicate with you about your account and updates</li>
              <li>To analyze usage patterns and improve our product</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Sharing</h2>
            <p className="mb-4">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third parties that help us operate our service (hosting, analytics, AI providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Vercel:</strong> Hosting and analytics</li>
              <li><strong>Anthropic/Google:</strong> AI processing for brand analysis</li>
              <li><strong>X (Twitter) API:</strong> To fetch public profile data you authorize</li>
              <li><strong>Sentry:</strong> Error monitoring and performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encryption in transit and at rest.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p>For privacy-related questions, contact us at:</p>
            <p className="mt-2"><strong>Email:</strong> privacy@mybrandos.app</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <a href="/" className="text-blue-400 hover:underline">&larr; Back to Home</a>
        </div>
      </div>
    </div>
  );
}
