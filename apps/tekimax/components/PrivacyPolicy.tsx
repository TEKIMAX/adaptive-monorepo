import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-tekimax-navy text-white font-sans selection:bg-tekimax-orange selection:text-white">
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 bg-tekimax-navy/90 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto w-full flex items-center gap-4">
                    <a href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </a>
                    <div className="flex items-center gap-3">
                        <img src="/images/tekimax-logo-white-RGB-2.png" alt="Tekimax Logo" className="h-8 w-auto" />
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <h1 className="font-serif text-4xl md:text-5xl text-white mb-8">Privacy Policy</h1>
                <p className="text-white/50 mb-12 uppercase tracking-widest text-xs font-bold">Last updated: December 24, 2025</p>

                <div className="prose prose-invert prose-lg max-w-none text-white/80">
                    <p>
                        TEKIMAX LLC ("us", "we", or "our") operates the Adaptive Startup website and platform (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">1. Information Collection and Use</h3>
                    <p>
                        We collect several different types of information for various purposes to provide and improve our Service to you.
                    </p>
                    <h4 className="text-white font-bold uppercase tracking-wider text-sm mt-8 mb-4">Types of Data Collected</h4>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to: Email address, First name and last name, Cookies and Usage Data.</li>
                        <li><strong>Usage Data:</strong> We may also collect information how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</li>
                    </ul>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">2. Use of Data</h3>
                    <p>
                        TEKIMAX LLC uses the collected data for various purposes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>To provide and maintain the Service</li>
                        <li>To notify you about changes to our Service</li>
                        <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                        <li>To provide customer care and support</li>
                        <li>To provide analysis or valuable information so that we can improve the Service</li>
                        <li>To monitor the usage of the Service</li>
                        <li>To detect, prevent and address technical issues</li>
                        <li>To process payments and manage subscriptions</li>
                        <li>To generate AI-powered content and insights</li>
                    </ul>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">3. Transfer of Data</h3>
                    <p>
                        Your information, including Personal Data, may be transferred to (and maintained on) computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
                    </p>
                    <p>
                        If you are located outside United States and choose to provide information to us, please note that we transfer the data, including Personal Data, to United States and process it there.
                    </p>
                    <p>
                        Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">4. Disclosure of Data</h3>
                    <p>
                        TEKIMAX LLC may disclose your Personal Data in the good faith belief that such action is necessary to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>To comply with a legal obligation</li>
                        <li>To protect and defend the rights or property of TEKIMAX LLC</li>
                        <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
                        <li>To protect the personal safety of users of the Service or the public</li>
                        <li>To protect against legal liability</li>
                    </ul>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">5. Security of Data</h3>
                    <p>
                        The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                    </p>
                    <p>
                        We use TLS 1.3 and quantum security measures to protect data from "collect now, decrypt later" attacks, with native support for Post-Quantum TLS.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">6. Service Providers</h3>
                    <p>
                        We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
                    </p>
                    <p>
                        These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose. Our key service providers fall into the following categories:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li><strong>Cloud Infrastructure & Database Providers:</strong> To host our platform and store data securely (e.g., Convex, Cloudflare).</li>
                        <li><strong>Authentication Services:</strong> To manage secure user logins and identity verification (e.g., WorkOS).</li>
                        <li><strong>Payment Processors:</strong> To handle billing and subscriptions securely (e.g., Stripe).</li>
                        <li><strong>Artificial Intelligence Partners:</strong> To generate content and business insights (e.g., Google Gemini).</li>
                    </ul>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">7. Your Data Rights</h3>
                    <p>
                        Depending on your location (including Texas and other US jurisdictions), you may have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">8. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>By email: <a href="mailto:info@tekimax.com" className="text-tekimax-orange hover:underline">info@tekimax.com</a></li>
                        <li>Location: 600 Bryan Ave. Suite 220, Fort Worth TX 76104</li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
