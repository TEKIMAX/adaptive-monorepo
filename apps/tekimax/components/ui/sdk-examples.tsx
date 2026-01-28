import React from "react";
import { CodeExampleCard } from "./code-example-stack";

export const sdkCodeExamples: CodeExampleCard[] = [
    {
        id: 1,
        step: 1,
        title: "Provision Backend",
        description: "Single command to provision backend, auth, and database.",
        filename: "terminal",
        color: "blue",
        badge: "CLI",
        code: (
            <pre className="text-[11px] md:text-[12px] text-white/80 leading-relaxed font-mono">
                <span className="text-gray-500"># Provision comprehensive backend</span>{'\n'}
                <span className="text-green-400">npx</span> tekimax create my-app{'\n'}
                <span className="text-blue-400">&gt;</span> Provisioning Infrastructure... <span className="text-green-400">Done</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Configuring Authentication... <span className="text-green-400">Done</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Provisioning Stripe... <span className="text-green-400">Done</span>{'\n'}
                <span className="text-purple-400">&gt; Ready to Vibe Code!</span>
            </pre>
        ),
    },
    {
        id: 2,
        step: 2,
        title: "Start Vibe Coding",
        description: "Focus on your solution with AI-enhanced hot reloading.",
        filename: "terminal",
        color: "pink",
        badge: "Dev",
        code: (
            <pre className="text-[11px] md:text-[12px] text-white/80 leading-relaxed font-mono">
                <span className="text-gray-500"># Start the Vibe Coding Engine</span>{'\n'}
                <span className="text-green-400">npx</span> tekimax dev{'\n\n'}
                <span className="text-blue-400">&gt;</span> AI Agent Active: <span className="text-yellow-300">Watching filesystem</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Connecting to Local LLM... <span className="text-green-400">Connected</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Select Model Provider... <span className="text-green-400">Claude Opus</span>{'\n'}
                <span className="text-blue-400">&gt;</span> <span className="underline">http://localhost:3000</span>
            </pre>
        ),
    },
    {
        id: 3,
        step: 3,
        title: "Secure & Audit",
        description: "Verify human agency and cryptographic signatures.",
        filename: "terminal",
        color: "orange",
        badge: "Audit",
        code: (
            <pre className="text-[11px] md:text-[12px] text-white/80 leading-relaxed font-mono">
                <span className="text-gray-500"># Verify Security & Provenance</span>{'\n'}
                <span className="text-green-400">npx</span> tekimax audit{'\n\n'}
                <span className="text-blue-400">&gt;</span> Checking CVEs... <span className="text-green-400">0 Found</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Verifying Signatures... <span className="text-green-400">Valid</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Enable HIPAA Compliance... <span className="text-green-400">True</span>{'\n'}
                <span className="text-purple-400">&gt; Compliance: PASSED</span>
            </pre>
        ),
    },
    {
        id: 4,
        step: 4,
        title: "Cryptographic Provenance",
        description: "Enable cryptographic signatures for human/AI differentiation.",
        filename: "terminal",
        color: "teal",
        badge: "Crypto",
        code: (
            <pre className="text-[11px] md:text-[12px] text-white/80 leading-relaxed font-mono">
                <span className="text-gray-500"># Add AI Feature with Provenance</span>{'\n'}
                <span className="text-green-400">npx</span> tekimax add feature --with-provenance{'\n\n'}
                <span className="text-blue-400">&gt;</span> Scaffolding AI Endpoint... <span className="text-green-400">Done</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Enabling Human/AI Differentiation... <span className="text-green-400">True</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Content Watermarking... <span className="text-green-400">Active</span>{'\n'}
                <span className="text-purple-400">&gt; Transparent UI Badges: Added</span>
            </pre>
        ),
    },
    {
        id: 5,
        step: 5,
        title: "Global Deploy",
        description: "One-click deployment to global edge network.",
        filename: "terminal",
        color: "purple",
        badge: "Ship",
        code: (
            <pre className="text-[11px] md:text-[12px] text-white/80 leading-relaxed font-mono">
                <span className="text-gray-500"># Ship to Global Edge</span>{'\n'}
                <span className="text-green-400">npx</span> tekimax deploy{'\n\n'}
                <span className="text-blue-400">&gt;</span> Optimizing assets... <span className="text-green-400">Done</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Distributing to Cloudflare... <span className="text-green-400">Done</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Distributing to AWS... <span className="text-yellow-500">Pending</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Distributing to Google... <span className="text-yellow-500">Pending</span>{'\n'}
                <span className="text-blue-400">&gt;</span> Distributing to Azure... <span className="text-yellow-500">Pending</span>{'\n'}
                <span className="text-purple-400">&gt; https://my-app.tekimax.app</span>
            </pre>
        ),
    },
    {
        id: 6,
        step: 6,
        title: "Hiring Our Heroes",
        description: "Military spouse hiring pledge & veteran AI training workshops.",
        filename: "community",
        color: "cyan",
        badge: "Impact",
        code: (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-1 rounded-full flex-shrink-0">
                        <img
                            src="/images/BSF_41_Badge_Icon_Final_Dec23-150x150.webp"
                            alt="Hiring Our Heroes 4+1 Pledge"
                            className="w-12 h-12 object-contain"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="text-teal-400 font-bold text-[11px] uppercase tracking-widest mb-1">Impact Pledge</div>
                        <div className="text-white text-xs leading-relaxed">
                            We've taken the <a href="https://www.hiringourheroes.org/4plus1/" target="_blank" rel="noopener noreferrer" className="text-tekimax-blue underline underline-offset-2">4+1 Pledge</a> to support military spouses and veterans.
                        </div>
                    </div>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-sm">
                    <div className="text-pink-400 font-bold text-[10px] uppercase tracking-widest mb-1">Free Workshops</div>
                    <div className="text-[11px] text-white/80 leading-relaxed">
                        Every 3rd Wednesday: Vibe Coding Fundamentals & AI Environment setup for Veterans.
                    </div>
                </div>
            </div>
        ),
    },
];
