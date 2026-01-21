export const metadata = {
  title: "Terms of Service | BrandOS",
  description: "Terms of Service for BrandOS",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: January 21, 2026</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">By accessing or using BrandOS ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</p>
            <p>These Terms constitute a legally binding agreement between you and BrandOS. Please read them carefully before using our Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="mb-4">BrandOS is an AI-powered brand analysis and content generation platform that helps creators and businesses understand and develop their brand identity. Our Service includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Brand DNA creation and management</li>
              <li>Content analysis and scoring for brand alignment</li>
              <li>AI-powered content generation</li>
              <li>X (Twitter) profile analysis and brand scoring</li>
              <li>Platform adaptation for social media content</li>
              <li>Team collaboration features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 13 years old to use the Service</li>
              <li>One person or entity may not maintain more than one account</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. X (Twitter) Integration</h2>
            <p className="mb-4">Our Service integrates with X (Twitter) to provide brand analysis features. By using these features, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authorization:</strong> You authorize BrandOS to access your X account information through X's OAuth authentication</li>
              <li><strong>Data Access:</strong> We access your public profile information, tweets, and engagement metrics as authorized by you</li>
              <li><strong>Limited Use:</strong> We use X data solely to provide brand analysis, scoring, and content recommendations</li>
              <li><strong>No Posting:</strong> BrandOS does not post, like, retweet, or take any actions on your behalf on X without your explicit consent</li>
              <li><strong>Revocation:</strong> You may revoke BrandOS's access to your X account at any time through your X account settings</li>
              <li><strong>X Terms:</strong> Your use of X integration features is also subject to X's Terms of Service and Privacy Policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Use the Service to harass, abuse, defame, or harm others</li>
              <li>Scrape, collect, or harvest data from the Service without permission</li>
              <li>Use automated systems, bots, or scripts to access the Service without permission</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
              <li>Use the Service to generate spam, misleading content, or misinformation</li>
              <li>Violate X's Terms of Service or any other third-party platform's terms</li>
              <li>Use the Service to create content that infringes on intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
            <p className="mb-4"><strong>Your Content:</strong> You retain ownership of content you submit to the Service, including your brand information, text, and uploaded materials. By submitting content, you grant BrandOS a non-exclusive, worldwide, royalty-free license to use, process, and analyze it to provide the Service.</p>
            <p className="mb-4"><strong>Our Content:</strong> The Service, including its design, features, software, and content, is owned by BrandOS and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our permission.</p>
            <p><strong>Feedback:</strong> Any feedback, suggestions, or ideas you provide about the Service may be used by us without any obligation to you.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. AI-Generated Content</h2>
            <p className="mb-4">Content generated by our AI tools is provided for your use, subject to the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are solely responsible for reviewing and ensuring the appropriateness of any AI-generated content before use</li>
              <li>AI-generated content may not be accurate, complete, or suitable for your purposes</li>
              <li>You should not rely on AI-generated content for legal, medical, financial, or other professional advice</li>
              <li>You are responsible for ensuring AI-generated content does not infringe on third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Services</h2>
            <p className="mb-4">The Service integrates with various third-party services, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>X (Twitter) for social media analysis and authentication</li>
              <li>Stripe for payment processing</li>
              <li>AI providers (Anthropic, Google) for content analysis and generation</li>
            </ul>
            <p className="mt-4">Your use of these integrations is subject to the respective third party's terms of service and privacy policies. BrandOS is not responsible for the practices or content of third-party services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Payment and Subscription</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Certain features require a paid subscription</li>
              <li>Subscription fees are billed in advance on a recurring basis</li>
              <li>You may cancel your subscription at any time; cancellation takes effect at the end of the billing period</li>
              <li>Refunds are provided at our discretion</li>
              <li>We reserve the right to change pricing with notice to subscribers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR MEET YOUR REQUIREMENTS. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, BRANDOS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Indemnification</h2>
            <p>You agree to indemnify and hold harmless BrandOS and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of a third party.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p>We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Service or by email. Your continued use of the Service after changes constitutes acceptance of the new Terms. If you do not agree to the changes, you must stop using the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Termination</h2>
            <p className="mb-4">We reserve the right to suspend or terminate your account at any time, with or without cause or notice, including for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violations of these Terms</li>
              <li>Requests by law enforcement</li>
              <li>Extended periods of inactivity</li>
              <li>Any other reason at our discretion</li>
            </ul>
            <p className="mt-4">Upon termination, your right to use the Service will immediately cease. Provisions that by their nature should survive termination will survive.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">16. Dispute Resolution</h2>
            <p>Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive any right to participate in a class action lawsuit or class-wide arbitration.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">17. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <p className="mt-2"><strong>Email:</strong> legal@mybrandos.app</p>
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
