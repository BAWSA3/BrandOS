import { notFound } from 'next/navigation';
import { dmcaAgent } from '@/lib/dmca';

export const metadata = {
  title: 'Copyright & DMCA | BrandOS',
  description: 'How to report copyright infringement on BrandOS',
};

// Read the agent at request time (env set in Vercel, no rebuild needed).
export const dynamic = 'force-dynamic';

export default function CopyrightPage() {
  const agent = dmcaAgent();
  if (!agent) notFound();

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Copyright &amp; DMCA</h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <p>
              BrandOS respects the intellectual property rights of others. If you believe content on
              BrandOS infringes your copyright, send a notice to our designated agent under the
              Digital Millennium Copyright Act (17 U.S.C. § 512).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Designated agent</h2>
            <p className="whitespace-pre-line">
              {agent.name}
              {'\n'}
              {agent.address}
              {'\n'}
              <a href={`mailto:${agent.email}`} className="underline">
                {agent.email}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What a notice must include</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your physical or electronic signature</li>
              <li>The copyrighted work you believe was infringed</li>
              <li>
                The material you say is infringing, and enough information (such as its URL) for us
                to find it
              </li>
              <li>Your name, address, phone number and email</li>
              <li>
                A statement that you believe in good faith the use is not authorized by the
                copyright owner, its agent or the law
              </li>
              <li>
                A statement, under penalty of perjury, that the information in your notice is
                accurate and that you are the owner or authorized to act for the owner
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Counter-notice</h2>
            <p className="mb-4">
              If your content was removed and you believe that was a mistake or misidentification,
              you can send a counter-notice to the same agent. It must include your signature, the
              removed material and where it appeared, a statement under penalty of perjury that you
              believe it was removed by mistake or misidentification, your name, address and phone
              number, and your consent to the jurisdiction of the federal court for your address
              (or, outside the US, any district where BrandOS may be found) and to accept service
              from the person who sent the original notice.
            </p>
            <p>
              We may restore the material 10 to 14 business days after receiving a valid
              counter-notice unless the original sender tells us they have filed a court action.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Repeat infringers</h2>
            <p>
              We terminate, in appropriate circumstances, the accounts of users who repeatedly
              infringe others&apos; copyrights.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
