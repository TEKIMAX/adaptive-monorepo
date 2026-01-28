

const clients = [
    process.env.WORKOS_CLIENT_ID, // From Environment
    "client_01K9JVWWW098XKKKNZM3JR8XQK", // Dev (from .env.local)
    // "client_01K9JVWXDAJTNN6753VJR038DB", // Prod (from .env.production)
].filter((id, index, self) => id && self.indexOf(id) === index); // Deduplicate and remove undefined

const authConfig = {
    providers: clients.flatMap(clientId => [
        {
            type: "customJwt",
            issuer: "https://api.workos.com/",
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
            applicationID: clientId,
        },
        {
            type: "customJwt",
            issuer: `https://api.workos.com/user_management/${clientId}`,
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
        },
        {
            type: "customJwt",
            issuer: `https://api.workos.com/user_management/${clientId}/`,
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
        },
        {
            type: "customJwt",
            issuer: `https://api.workos.com/sso/oidc/${clientId}`,
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
        },
        {
            type: "customJwt",
            issuer: `https://api.workos.com/sso/oidc/${clientId}/`,
            algorithm: "RS256",
            jwks: `https://api.workos.com/sso/jwks/${clientId}`,
        },
    ]),
};


export default authConfig;
