export interface Env {
    DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    try {
        const data = await request.json() as {
            name?: string;
            email?: string;
            subject?: string;
            message?: string;
        };

        // 1. Validate Input (Server-side validation is crucial for security)
        if (!data.name || !data.email || !data.message) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2. Insert into D1 Database (Securely using bindings)
        // The 'DB' binding must be configured in wrangler.toml and pointing to a D1 database.
        // bind() protects against SQL injection.
        const result = await env.DB.prepare(
            "INSERT INTO contacts (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)"
        )
            .bind(data.name, data.email, data.subject || "No Subject", data.message, Date.now())
            .run();

        if (!result.success) {
            throw new Error("Failed to insert into database");
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Contact Form Error:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
