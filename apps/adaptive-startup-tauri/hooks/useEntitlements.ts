import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Entitlements } from "../convex/permissions";

export function useEntitlements() {
    const user = useQuery(api.users.getUser);

    // Default restrictive entitlements while loading or if logged out
    const defaultEntitlements: Entitlements = {
        canUseAIChat: false,
        aiModel: "canvas",
        aiRateLimited: true,
        canUseMarketResearch: false,
        canUseFinancialModeling: false,
        maxActiveProjects: 0,
        canAccessSpecialistTools: false,
        canAccessDedicatedBackend: false,
        tierName: "Explorer"
    };

    if (!user || !user.entitlements) {
        return {
            ...defaultEntitlements,
            isLoading: !user && user !== null, // user === null means not logged in
            isLoggedIn: !!user
        };
    }

    return {
        ...user.entitlements,
        isLoading: false,
        isLoggedIn: true
    };
}
