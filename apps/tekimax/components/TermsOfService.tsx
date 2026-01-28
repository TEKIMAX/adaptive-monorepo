import React from 'react';

const TermsOfService: React.FC = () => {
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
                <h1 className="font-serif text-4xl md:text-5xl text-white mb-8">Master Terms of Service</h1>
                <p className="text-white/50 mb-12 uppercase tracking-widest text-xs font-bold">Last updated: December 24, 2025</p>

                <div className="prose prose-invert prose-lg max-w-none text-white/80">
                    <p>
                        Please read these Master Terms of Service ("Terms") carefully before using the TEKIMAX ecosystem. These Terms govern your access to and use of all products provided by TEKIMAX LLC ("we," "us," or "our"), including but not limited to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li><strong>Adaptive Startup:</strong> The Entrepreneurial Operating System and associated tools.</li>
                        <li><strong>Tekimax Adaptive Learning:</strong> The cognitive exoskeleton and neurodivergent learning platform.</li>
                        <li><strong>The Self-Adaptive Engine:</strong> The underlying AI state machine and intelligence core powering our services (collectively, the "Service").</li>
                    </ul>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">1. Acceptance of Terms</h3>
                    <p>
                        By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">2. Nature of Services: Beta & Experimental</h3>
                    <p>
                        You acknowledge that parts of the Service (specifically the "Self-Adaptive Engine" and "Cognitive Exoskeleton") are experimental in nature and may be designated as "Beta" or "Research Preview." These services may not operate correctly and may be substantially modified or discontinued at any time. We are not liable for any data loss, service interruption, or performance issues associated with Beta features.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">3. Generative AI Disclaimer</h3>
                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10 my-8">
                        <h4 className="text-tekimax-orange font-bold mt-0 text-lg mb-4">Important Warning Regarding AI Outputs</h4>
                        <p className="mb-4 text-sm text-white/90">
                            Our Service utilizes advanced Large Language Models (LLMs) and generative artificial intelligence. By using the Service, you acknowledge and agree to the following:
                        </p>
                        <ul className="list-disc pl-6 text-sm space-y-3 text-white/80">
                            <li><strong>Risk of Hallucinations:</strong> AI models are probabilistic and may generate information that is inaccurate, factually incorrect, or nonsensical ("hallucinations"). Output may sound authoritative but be completely false. **You must independently verify all AI-generated content.**</li>
                            <li><strong>No Professional Advice:</strong> The Service is for informational and productivity purposes only. It does **not** constitute legal, financial, medical, or other professional advice. Do not rely on the Service for critical decisions (e.g., term sheets, medical diagnosis, investment strategy) without consulting a qualified human professional.</li>
                            <li><strong>Non-Deterministic Outcomes:</strong> The "Self-Adaptive Engine" evolves based on input. We cannot guarantee that the Service will produce the same output for the same input at different times.</li>
                            <li><strong>Bias & Safety:</strong> While we implement safety guardrails, AI models can reflect biases present in their training data. We do not endorse any opinions generated by the AI.</li>
                        </ul>
                    </div>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">4. User Responsibility</h3>
                    <p>
                        You are solely responsible for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-8">
                        <li>Verifying the accuracy and suitability of any output (documents, plans, code, or advice) generated by the Service.</li>
                        <li>Ensuring that your use of the Service complies with all applicable laws and regulations.</li>
                        <li>The security of your account credentials and API keys.</li>
                    </ul>
                    <p>
                        TEKIMAX LLC is not responsible for any errors, omissions, or financial losses resulting from your reliance on AI-generated content.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">5. Intellectual Property</h3>
                    <p>
                        <strong>Our IP:</strong> The Service, including the "Self-Adaptive Engine," algorithms, software, and original content, is the exclusive property of TEKIMAX LLC and its licensors.
                        <br /><br />
                        <strong>Your IP:</strong> You retain ownership of the specific business data and content you input into the Service. However, you grant us a license to process this data to provide the Service to you. Regarding AI-generated output, we assign to you all rights, title, and interest in the output to the extent permitted by law, provided you have complied with these Terms.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">6. Subscription and Payments</h3>
                    <p>
                        Certain features are billed on a subscription basis. You agree to pay all fees in accordance with the pricing terms in effect at the time of purchase. We use third-party processors (e.g., Stripe) for secure billing and do not store your full credit card information.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">7. Limitation of Liability</h3>
                    <p className="uppercase text-xs font-bold tracking-widest leading-relaxed border-l-2 border-tekimax-orange pl-4 py-2 my-8 text-white/70">
                        To the maximum extent permitted by law, TEKIMAX LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from: (a) your use or inability to use the Service; (b) any AI-generated errors or "hallucinations"; (c) unauthorized access to or use of our servers and/or any personal information stored therein.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">8. Termination</h3>
                    <p>
                        We may terminate or suspend your access immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">9. Governing Law</h3>
                    <p>
                        These Terms shall be governed by the laws of the State of Texas, without regard to its conflict of law provisions.
                    </p>

                    <h3 className="text-tekimax-orange font-serif italic mt-12 mb-6 text-2xl">10. Contact Us</h3>
                    <p>
                        If you have any questions about these Terms, please contact us:
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

export default TermsOfService;
