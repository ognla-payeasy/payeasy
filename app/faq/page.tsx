"use client";

import { Accordion } from "@/components/ui/accordion";
import { PageTransition } from "@/components/ui/page-transition";

const FAQ_ITEMS = [
  {
    id: "what-is-escrow",
    title: "What is a Stellar escrow and how does it work?",
    content:
      "A Stellar escrow is a smart contract that holds funds until specific conditions are met. In PayEasy, when roommates split rent, the escrow holds the money until the payment deadline is reached. Once the deadline passes, the landlord can release the funds. If the deadline is missed or cancelled, funds can be refunded to renters. This ensures trustless, transparent payment sharing without needing a middleman.",
  },
  {
    id: "what-is-freighter",
    title: "What is Freighter and why do I need it?",
    content:
      "Freighter is a browser wallet for the Stellar blockchain. It securely manages your private keys and allows you to sign transactions without exposing your credentials. PayEasy integrates with Freighter so you can connect your wallet, fund escrows, and manage payments directly from the app. Download it as a browser extension to get started.",
  },
  {
    id: "what-is-stellar",
    title: "What is Stellar and how is it different from other blockchains?",
    content:
      "Stellar is a fast, low-cost blockchain designed for payments. Unlike Bitcoin or Ethereum, Stellar processes transactions in 3-5 seconds with minimal fees (typically fractions of a cent per transaction). This makes it ideal for rent payments where speed and affordability matter. Stellar is maintained by the Stellar Development Foundation and has been trusted for payments since 2014.",
  },
  {
    id: "what-are-fees",
    title: "What fees does PayEasy charge?",
    content:
      "PayEasy itself charges no platform fees. You only pay Stellar network fees, which are extremely small—typically 0.00001 XLM per operation (worth less than a penny). There are no hidden charges, escrow fees, or processing costs. The only cost is the minimal Stellar network fee required by the blockchain to process your transaction.",
  },
  {
    id: "testnet-vs-mainnet",
    title: "What's the difference between testnet and mainnet?",
    content:
      "Testnet is Stellar's sandbox for testing. You can use free test XLM from Friendbot to experiment without real money. It's perfect for learning PayEasy and creating test escrows. Mainnet is the live Stellar network where real XLM and real money transactions happen. Start on testnet to get comfortable, then move to mainnet when you're ready to use real funds.",
  },
  {
    id: "how-to-release",
    title: "How do I release funds from an escrow after the deadline?",
    content:
      "Once the escrow deadline has passed, the payment recipient (usually the landlord) can release funds through the PayEasy dashboard. Navigate to the escrow, check that the deadline has passed, and click the Release button. You'll confirm the transaction in Freighter, and the funds will be transferred to the recipient's wallet. This typically completes within 5 seconds.",
  },
  {
    id: "how-to-contribute",
    title: "How do I contribute funds to an escrow?",
    content:
      "To contribute to an escrow: 1) Connect your Freighter wallet, 2) Navigate to the escrow, 3) Enter your contribution amount, 4) Confirm the transaction in Freighter. Your funds will be held in the escrow until the deadline passes. You can see your contribution progress on the escrow dashboard, and if the deadline is cancelled for any reason, you can request a refund of your contribution.",
  },
  {
    id: "what-is-deadline",
    title: "What is the escrow deadline and why does it matter?",
    content:
      "The escrow deadline is the date by which all roommates must contribute their share of rent. Once the deadline passes, the escrow becomes locked—no more contributions can be made. Only after the deadline can funds be released to the landlord. If someone misses the deadline, they'll need to either contribute late (if the landlord allows) or handle it separately. Choose deadlines strategically to give everyone enough time.",
  },
  {
    id: "can-contribute-after-deadline",
    title: "Can I contribute to an escrow after the deadline?",
    content:
      "No, once the deadline passes, the escrow is locked and no new contributions can be accepted. This is by design to prevent disputes about who paid and when. If you miss a deadline, discuss with your roommates to either: 1) Update the deadline and freeze/unfreeze the escrow, or 2) Handle the late payment outside the escrow. It's important to set realistic deadlines that work for everyone.",
  },
  {
    id: "what-if-someone-doesnt-pay",
    title: "What if a roommate doesn't contribute their share?",
    content:
      "PayEasy's escrow system enforces contribution transparency. If a roommate doesn't contribute by the deadline, you'll immediately see it on the dashboard. You have several options: 1) Negotiate with them directly, 2) Extend the deadline and freeze the escrow, 3) Cover their share yourself, or 4) Cancel the escrow and refund contributions. The blockchain ensures no one can secretly keep funds—everything is transparent and auditable.",
  },
  {
    id: "how-to-get-testnet-xlm",
    title: "How do I get test XLM for testnet?",
    content:
      "When viewing the wallet on testnet, you'll see a 'Friendbot' button. Click it to receive 10,000 test XLM instantly. This testnet-only currency is free and lets you experiment with PayEasy without spending real money. Friendbot can be used multiple times, so you can always get more test XLM if you run out. Test XLM has no real-world value.",
  },
  {
    id: "can-i-refund-contribution",
    title: "Can I refund my contribution once it's in the escrow?",
    content:
      "Yes, you can refund your contribution before the deadline is reached. Navigate to the escrow, view your contribution, and click the Refund button. You'll confirm in Freighter, and your funds will be returned to your wallet. Once the deadline passes, the escrow is locked—you'll need to contact the recipient to arrange a refund. Plan ahead and contribute only when you're certain.",
  },
];

export default function FAQPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#0a0a0f]">
        {/* Hero Section */}
        <div className="px-4 py-16 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-display">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-dark-500 leading-relaxed">
              Everything you need to know about PayEasy, Stellar escrows, and blockchain-powered rent sharing.
            </p>
          </div>

          {/* Accordion */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8">
            <Accordion items={FAQ_ITEMS} allowMultiple={true} data={{ qa: "faq" }} />
          </div>

          {/* CTA Section */}
          <div className="mt-12 p-6 sm:p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-brand-500/10 to-transparent">
            <h2 className="text-lg font-semibold text-white mb-2">
              Still have questions?
            </h2>
            <p className="text-dark-500 mb-4">
              Check out our documentation or reach out to the community on GitHub.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="https://github.com/payeasy/payeasy"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary !rounded-lg text-sm"
              >
                Visit GitHub
              </a>
              <a
                href="/terms"
                className="btn-secondary !rounded-lg text-sm"
              >
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
