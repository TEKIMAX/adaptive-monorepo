
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface TermsOfServiceProps {
    onLogin: () => void;
    onNavigateHome: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ onLogin, onNavigateHome }) => {
    return (
        <div className="min-h-screen bg-[#F9F8F4] font-sans text-stone-900 selection:bg-nobel-gold selection:text-white">
            <Helmet>
                <title>Terms of Service | Adaptive Startup</title>
                <meta name="description" content="Terms of Service for Adaptive Startup. Understand the rules and regulations for using our operating system for founders." />
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
                <h1 className="font-serif text-4xl md:text-5xl text-stone-900 mb-8">Master Terms of Service</h1>
                <p className="text-stone-500 mb-12">Last updated: December 24, 2025</p>

                <div className="prose prose-stone prose-lg max-w-none">
                    <p>
                        Please read these Master Terms of Service ("Terms") carefully before using the TEKIMAX ecosystem. These Terms govern your access to and use of all products provided by TEKIMAX LLC ("we," "us," or "our"), including but not limited to:
                    </p>
                    <ul>
                        <li><strong>Adaptive Startup:</strong> The Entrepreneurial Operating System and associated tools.</li>
                        <li><strong>Tekimax Adaptive Learning:</strong> The cognitive exoskeleton and neurodivergent learning platform.</li>
                        <li><strong>The Self-Adaptive Engine:</strong> The underlying AI state machine and intelligence core powering our services (collectively, the "Service").</li>
                    </ul>

                    <h3>1. Acceptance of Terms</h3>
                    <p>
                        By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                    </p>

                    <h3>2. Nature of Services: Beta & Experimental</h3>
                    <p>
                        You acknowledge that parts of the Service (specifically the "Self-Adaptive Engine" and "Cognitive Exoskeleton") are experimental in nature and may be designated as "Beta" or "Research Preview." These services may not operate correctly and may be substantially modified or discontinued at any time. We are not liable for any data loss, service interruption, or performance issues associated with Beta features.
                    </p>

                    <h3>3. Generative AI Disclaimer</h3>
                    <div className="bg-stone-100 p-6 rounded-xl border border-stone-200 my-6">
                        <h4 className="text-stone-900 font-bold mt-0">Important Warning Regarding AI Outputs</h4>
                        <p className="mb-0 text-sm">
                            Our Service utilizes advanced Large Language Models (LLMs) and generative artificial intelligence. By using the Service, you acknowledge and agree to the following:
                        </p>
                        <ul className="text-sm mt-4 space-y-2">
                            <li><strong>Risk of Hallucinations:</strong> AI models are probabilistic and may generate information that is inaccurate, factually incorrect, or nonsensical ("hallucinations"). Output may sound authoritative but be completely false. **You must independently verify all AI-generated content.**</li>
                            <li><strong>No Professional Advice:</strong> The Service is for informational and productivity purposes only. It does **not** constitute legal, financial, medical, or other professional advice. Do not rely on the Service for critical decisions (e.g., term sheets, medical diagnosis, investment strategy) without consulting a qualified human professional.</li>
                            <li><strong>Non-Deterministic Outcomes:</strong> The "Self-Adaptive Engine" evolves based on input. We cannot guarantee that the Service will produce the same output for the same input at different times.</li>
                            <li><strong>Bias & Safety:</strong> While we implement safety guardrails, AI models can reflect biases present in their training data. We do not endorse any opinions generated by the AI.</li>
                        </ul>
                    </div>

                    <h3>4. User Responsibility</h3>
                    <p>
                        You are solely responsible for:
                        <ul>
                            <li>Verifying the accuracy and suitability of any output (documents, plans, code, or advice) generated by the Service.</li>
                            <li>Ensuring that your use of the Service complies with all applicable laws and regulations.</li>
                            <li>The security of your account credentials and API keys.</li>
                        </ul>
                        TEKIMAX LLC is not responsible for any errors, omissions, or financial losses resulting from your reliance on AI-generated content.
                    </p>

                    <h3>5. Intellectual Property</h3>
                    <p>
                        <strong>Our IP:</strong> The Service, including the "Self-Adaptive Engine," algorithms, software, and original content, is the exclusive property of TEKIMAX LLC and its licensors.
                        <br /><br />
                        <strong>Your IP:</strong> You retain ownership of the specific business data and content you input into the Service. However, you grant us a license to process this data to provide the Service to you. Regarding AI-generated output, we assign to you all rights, title, and interest in the output to the extent permitted by law, provided you have complied with these Terms.
                    </p>

                    <h3>6. Subscription and Payments</h3>
                    <p>
                        Certain features are billed on a subscription basis. You agree to pay all fees in accordance with the pricing terms in effect at the time of purchase. We use third-party processors (e.g., Stripe) for secure billing and do not store your full credit card information.
                    </p>

                    <h3>7. Limitation of Liability</h3>
                    <p className="uppercase text-sm font-bold tracking-wide">
                        To the maximum extent permitted by law, TEKIMAX LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from: (a) your use or inability to use the Service; (b) any AI-generated errors or "hallucinations"; (c) unauthorized access to or use of our servers and/or any personal information stored therein.
                    </p>

                    <h3>8. Termination</h3>
                    <p>
                        We may terminate or suspend your access immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
                    </p>

                    <h3>9. Governing Law</h3>
                    <p>
                        These Terms shall be governed by the laws of the State of Texas, without regard to its conflict of law provisions.
                    </p>

                    <h3>10. Contact Us</h3>
                    <p>
                        If you have any questions about these Terms, please contact us:
                        <ul>
                            <li>By email: <a href="mailto:legal@adaptivestartup.io" className="text-nobel-gold hover:underline">legal@adaptivestartup.io</a></li>
                        </ul>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
