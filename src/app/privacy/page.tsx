export const metadata = {
  title: "Privacy Policy | BrandOS",
  description: "Privacy Policy for BrandOS",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: January 21, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">BrandOS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at mybrandos.app ("the Service").</p>
            <p>By using our Service, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address (optional), and profile information when you create an account</li>
              <li><strong>Brand Information:</strong> Brand names, colors, keywords, tone preferences, voice samples, and other brand-related content you submit</li>
              <li><strong>Content:</strong> Text, documents, and other materials you submit for analysis or generation</li>
              <li><strong>Communications:</strong> Messages you send to us, including support requests and feedback</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through Stripe (we do not store full card numbers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Information from X (Twitter)</h3>
            <p className="mb-4">When you connect your X account or use our X analysis features, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Profile Information:</strong> Username, display name, profile picture, bio, follower/following counts</li>
              <li><strong>Tweets:</strong> Your public tweets, including text content and metadata</li>
              <li><strong>Engagement Metrics:</strong> Public metrics such as likes, retweets, replies, and impressions</li>
              <li><strong>Account Identifiers:</strong> X user ID for authentication and data association</li>
            </ul>
            <p className="mt-4 p-4 bg-gray-900 rounded-lg"><strong>Important:</strong> We only access data that you explicitly authorize through X's OAuth authentication process. We do not access your direct messages, private information, or data you have not authorized.</p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, actions taken, and time spent on the Service</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and screen resolution</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
              <li><strong>Cookies:</strong> Session cookies and preferences (see Section 9)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Delivery:</strong> To provide brand analysis, scoring, and content generation features</li>
              <li><strong>Brand DNA Creation:</strong> To generate and maintain your Brand DNA profile</li>
              <li><strong>X Analysis:</strong> To analyze your X presence and provide brand scoring and recommendations</li>
              <li><strong>AI Processing:</strong> To process your content through AI models for analysis and generation</li>
              <li><strong>Account Management:</strong> To create and manage your account</li>
              <li><strong>Communication:</strong> To send service updates, security alerts, and support messages</li>
              <li><strong>Improvement:</strong> To analyze usage patterns and improve our Service</li>
              <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. How We Use X (Twitter) Data</h2>
            <p className="mb-4">We use X data specifically and only for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authenticating your identity and maintaining your account</li>
              <li>Analyzing your public profile and tweets to generate brand insights</li>
              <li>Calculating your X Brand Score and providing recommendations</li>
              <li>Generating content suggestions based on your brand voice</li>
              <li>Providing platform-specific content adaptation</li>
            </ul>
            <p className="mt-4"><strong>We do NOT use X data to:</strong></p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Post content on your behalf without explicit consent</li>
              <li>Follow, unfollow, like, or retweet on your behalf</li>
              <li>Send direct messages</li>
              <li>Sell or share your X data with third parties for advertising</li>
              <li>Build profiles for targeted advertising</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4"><strong>We do not sell your personal information.</strong> We may share data with:</p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Vercel:</strong> Website hosting and analytics</li>
              <li><strong>Anthropic (Claude):</strong> AI content analysis and generation</li>
              <li><strong>Google (Gemini):</strong> AI content generation</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Sentry:</strong> Error monitoring and performance tracking</li>
              <li><strong>Resend:</strong> Email delivery</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Other Disclosures</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Legal Requirements:</strong> When required by law, subpoena, or court order</li>
              <li><strong>Protection:</strong> To protect our rights, property, or safety, or that of our users</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Consent:</strong> When you have given explicit consent to share</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active and for up to 30 days after deletion</li>
              <li><strong>Brand Data:</strong> Retained while your account is active; deleted upon account deletion</li>
              <li><strong>X Data:</strong> Cached temporarily for performance; refreshed periodically and deleted upon account deletion or access revocation</li>
              <li><strong>Content History:</strong> Retained while your account is active for your reference</li>
              <li><strong>Log Data:</strong> Retained for up to 90 days for security and debugging</li>
            </ul>
            <p className="mt-4">You can request deletion of your data at any time by contacting us or deleting your account.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights and Choices</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Export:</strong> Export your brand data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Revoke X Access:</strong> Disconnect your X account at any time through your X settings at https://twitter.com/settings/connected_apps or through your BrandOS account settings</li>
            </ul>
            <p className="mt-4">To exercise these rights, contact us at privacy@mybrandos.app</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Secure authentication and session management</li>
              <li>Regular security assessments</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="mt-4">While we strive to protect your data, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
            <p className="mb-4">We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
              <li><strong>Analytics Cookies:</strong> To understand how users interact with our Service</li>
              <li><strong>Preference Cookies:</strong> To remember your settings and preferences</li>
            </ul>
            <p className="mt-4">You can control cookies through your browser settings, but some features may not function properly without them.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p>Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Children's Privacy</h2>
            <p>Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. California Privacy Rights (CCPA)</h2>
            <p className="mb-4">California residents have additional rights under the CCPA:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed and to whom</li>
              <li>Right to opt out of the sale of personal information (we do not sell your data)</li>
              <li>Right to request deletion of personal information</li>
              <li>Right to non-discrimination for exercising these rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. European Privacy Rights (GDPR)</h2>
            <p className="mb-4">If you are in the European Economic Area, you have additional rights under GDPR:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Right to access, rectify, and erase your data</li>
              <li>Right to restrict or object to processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="mt-4">Our legal basis for processing includes: consent, contract performance, legitimate interests, and legal obligations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on the Service and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Us</h2>
            <p>For privacy-related questions, concerns, or to exercise your rights, contact us at:</p>
            <p className="mt-2"><strong>Email:</strong> privacy@mybrandos.app</p>
            <p className="mt-2"><strong>Website:</strong> https://mybrandos.app</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <a href="/" className="text-blue-400 hover:underline">&larr; Back to Home</a>
        </div>
      </div>
    </div>
  );
}
