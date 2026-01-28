import { Doc } from "./_generated/dataModel";

export type Entitlements = {
    canUseAIChat: boolean;
    aiModel: "canvas" | "advanced" | "enterprise"; // "canvas" = limited, "advanced" = pro, "enterprise" = all
    aiRateLimited: boolean; // true = restricted query count/size
    canUseMarketResearch: boolean;
    canUseFinancialModeling: boolean;
    maxActiveProjects: number;
    canAccessSpecialistTools: boolean;
    canAccessDedicatedBackend: boolean;
    tierName: "Explorer" | "Founder" | "Enterprise";
};

export const TIER_CONSTANTS = {
    STARTER: "starter", // Explorer
    PRO: "pro",         // Founder
    ENTERPRISE: "enterprise" // Enterprise
};

export function getEntitlements(user: Doc<"users">): Entitlements {
    const tier = user.subscriptionTier || TIER_CONSTANTS.STARTER;
    const status = user.subscriptionStatus || "inactive";
    const now = Date.now();

    // Check if trial is active
    const isTrialing = status === "trialing" && user.endsOn && user.endsOn > now;
    const isActive = status === 'active' || isTrialing;

    // Defaults for inactive/expired
    if (!isActive) {
        return {
            canUseAIChat: false,
            aiModel: "canvas",
            aiRateLimited: true,
            canUseMarketResearch: false,
            canUseFinancialModeling: false,
            maxActiveProjects: 0, // Read-only potentially
            canAccessSpecialistTools: false, // "sub access tool"
            canAccessDedicatedBackend: false,
            tierName: "Explorer"
        };
    }

    // Enterprise
    if (tier === TIER_CONSTANTS.ENTERPRISE) {
        return {
            canUseAIChat: true,
            aiModel: "enterprise",
            aiRateLimited: false,
            canUseMarketResearch: true,
            canUseFinancialModeling: true,
            maxActiveProjects: 5,
            canAccessSpecialistTools: true,
            canAccessDedicatedBackend: true,
            tierName: "Enterprise"
        };
    }

    // Founder (Pro)
    if (tier === TIER_CONSTANTS.PRO) {
        return {
            canUseAIChat: true, // "Context-Aware AI Chat"
            aiModel: "advanced",
            aiRateLimited: false,
            canUseMarketResearch: true,
            canUseFinancialModeling: true,
            // Landing page says "1 Active Project" for Explorer. Enterprise "5 Active Projects".
            // We set Founder to 3 projects as a middle ground.
            maxActiveProjects: 3,
            canAccessSpecialistTools: true,
            canAccessDedicatedBackend: false,
            tierName: "Founder"
        };
    }

    // Explorer (Starter) - Default Active/Trial
    return {
        canUseAIChat: true, // "AI Chat App" (Full Access)
        aiModel: "advanced",
        aiRateLimited: true,
        canUseMarketResearch: false, // Restricted
        canUseFinancialModeling: false,
        maxActiveProjects: 1,
        canAccessSpecialistTools: false,
        canAccessDedicatedBackend: false,
        tierName: "Explorer"
    };
}
