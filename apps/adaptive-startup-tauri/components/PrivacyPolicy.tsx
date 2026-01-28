
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface PrivacyPolicyProps {
    onLogin: () => void;
    onNavigateHome: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onLogin, onNavigateHome }) => {
    return (
        <div className="min-h-screen bg-[#F9F8F4] font-sans text-stone-900 selection:bg-nobel-gold selection:text-white">
            <Helmet>
                <title>Privacy Policy | Adaptive Startup</title>
                <meta name="description" content="Privacy Policy for Adaptive Startup. Learn how we collect, use, and protect your data." />
            </Helmet>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-stone-100">
                <div className="flex items-center gap-4">
                    <button onClick={onNavigateHome} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="cursor-pointer" onClick={onNavigateHome}>
                        <Logo className="flex items-center gap-3" imageClassName="h-10 w-auto rounded-lg" textClassName="font-serif font-bold text-2xl tracking-wide text-stone-900" />
                    </div>
                </div>
                <button onClick={onLogin} className="px-4 py-2 bg-stone-900 text-white rounded-full text-sm font-bold hover:bg-nobel-gold transition-colors">
                    Sign In
                </button>
            </nav>

            <main className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-8">Privacy Policy</h1>
                <p className="text-stone-500 mb-12">Last updated: December 11, 2026</p>

                <div className="prose prose-stone prose-lg max-w-none">
                    <p>
                        TEKIMAX LLC ("us", "we", or "our") operates the Adaptive Startup website and platform (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
                    </p>

                    <h3>1. Information Collection and Use</h3>
                    <p>
                        We collect several different types of information for various purposes to provide and improve our Service to you.
                    </p>
                    <h4>Types of Data Collected</h4>
                    <ul>
                        <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to: Email address, First name and last name, Cookies and Usage Data.</li>
                        <li><strong>Usage Data:</strong> We may also collect information how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</li>
                    </ul>

                    <h3>2. Use of Data</h3>
                    <p>
                        TEKIMAX LLC uses the collected data for various purposes:
                        <ul>
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
                    </p>

                    <h3>3. Transfer of Data</h3>
                    <p>
                        Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
                    </p>
                    <p>
                        If you are located outside United States and choose to provide information to us, please note that we transfer the data, including Personal Data, to United States and process it there.
                    </p>
                    <p>
                        Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
                    </p>

                    <h3>4. Disclosure of Data</h3>
                    <p>
                        TEKIMAX LLC may disclose your Personal Data in the good faith belief that such action is necessary to:
                        <ul>
                            <li>To comply with a legal obligation</li>
                            <li>To protect and defend the rights or property of TEKIMAX LLC</li>
                            <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
                            <li>To protect the personal safety of users of the Service or the public</li>
                            <li>To protect against legal liability</li>
                        </ul>
                    </p>

                    <h3>5. Security of Data</h3>
                    <p>
                        The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
                    </p>
                    <p>
                        We use TLS 1.3 and quantum security measures to protect data from "collect now, decrypt later" attacks, with native support for Post-Quantum TLS.
                    </p>

                    <h3>6. Service Providers</h3>
                    <p>
                        We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
                    </p>
                    <p>
                        These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose. Our key service providers fall into the following categories:
                    </p>
                    <ul>
                        <li><strong>Cloud Infrastructure & Database Providers:</strong> To host our platform and store data securely (e.g., Convex, Cloudflare).</li>
                        <li><strong>Authentication Services:</strong> To manage secure user logins and identity verification (e.g., WorkOS).</li>
                        <li><strong>Payment Processors:</strong> To handle billing and subscriptions securely (e.g., Stripe).</li>
                        <li><strong>Artificial Intelligence Partners:</strong> To generate content and business insights (e.g., Google Gemini).</li>
                    </ul>

                    <h3>7. Your Data Rights</h3>
                    <p>
                        Depending on your location (including Texas and other US jurisdictions), you may have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, please contact us.
                    </p>

                    <h3>8. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <ul>
                        <li>By email: <a href="mailto:info@adaptivestartup.io" className="text-nobel-gold hover:underline">info@adaptivestartup.io</a></li>
                        <li>Location: Fort Worth, Texas</li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
