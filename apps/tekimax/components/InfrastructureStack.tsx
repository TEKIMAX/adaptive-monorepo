"use client";
import React from "react";
import { InfrastructureCardStack, type InfrastructureCard } from "@/components/ui/infrastructure-card-stack";

export function InfrastructureStack({ darkButton = false }: { darkButton?: boolean } = {}) {
    const cards: InfrastructureCard[] = [
        {
            id: 1,
            title: "Modality-Adaptive Learning",
            quote: "Self-adapting content generation that personalizes to visual, auditory, or textual cognitive styles in real-time.",
            color: "blue",
            role: "Cognitive Adaptation",
            techLead: "/v1/stream-learning-content",
            badgeText: "Adaptive Modality",
            explanation: "Ensures equitable access and outcome across diverse cognitive modalities.",
            icon: (
                <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v6" />
                </svg>
            )
        },
        {
            id: 2,
            title: "Human Agency Preservation",
            quote: "Quantifiable oversight metrics ensuring AI augments decisions without replacing human ingenuity.",
            color: "pink",
            role: "Human-in-the-Loop",
            techLead: "/v1/signoff",
            badgeText: "Preserve Agency",
            explanation: "Provides meaningful human oversight pathways for every orchestrated AI decision.",
            icon: (
                <svg className="w-7 h-7 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            )
        },
        {
            id: 3,
            title: "Cryptographic Provenance",
            quote: "Cryptographic proof of human vs. AI authorship - verifiable attribution for every output.",
            color: "red",
            role: "Content Authenticity",
            techLead: "/v1/provenance/{id}",
            badgeText: "Verifiable Origin",
            explanation: "Implements synthetic content authenticity standards and secure human-in-the-loop audit trails.",
            icon: (
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            id: 4,
            title: "Verified Privacy & Logging",
            quote: "Systems must be 'Opt-In' by default. We implement signed manifests and real-time activity logging to mitigate centralized privacy risks.",
            color: "yellow",
            role: "Privacy Preservation",
            techLead: "/v1/activity-log",
            badgeText: "Default Opt-In",
            explanation: "Ensures automated modules only access app data via explicit manifests, with user-facing logs for every read/write action.",
            icon: (
                <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            )
        },
        {
            id: 5,
            title: "Reliability & Failure Logic",
            quote: "As workflow steps increase, reliability decays. We utilize deterministic fallbacks and HITL gates to secure multi-step success.",
            color: "green",
            role: "Fault Tolerance",
            techLead: "/v1/agent/validate",
            badgeText: "Decay Mitigation",
            explanation: "Mitigates the exponential decay of AI accuracy in long-running workflows through rigorous validation sign-offs.",
            icon: (
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
            )
        },
        {
            id: 6,
            title: "Semantic Security",
            quote: "Hardening the architectural boundary between instructions and data to neutralize indirect prompt injection attacks.",
            color: "purple",
            role: "Attack Mitigation",
            techLead: "/v1/security/isolate",
            badgeText: "Prompt Isolation",
            explanation: "Prevents AI systems from executing malicious code or exfiltrating data when processing untrusted inputs.",
            icon: (
                <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        }
    ];
    return (
        <div className="w-full flex justify-center py-2 md:py-10 max-w-[600px]">
            <InfrastructureCardStack items={cards} darkButton={darkButton} />
        </div>
    );
}
