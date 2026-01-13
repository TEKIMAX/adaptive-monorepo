use axum::response::{Html, IntoResponse};

pub async fn serve_logo() -> impl IntoResponse {
    let logo_bytes = include_bytes!("../logo.png");
    (
        [(axum::http::header::CONTENT_TYPE, "image/png")],
        logo_bytes.as_slice(),
    )
}

pub async fn openapi_spec() -> impl IntoResponse {
    let spec = include_str!("../../openapi.yaml");
    (
        [(axum::http::header::CONTENT_TYPE, "application/yaml")],
        spec,
    )
}

pub async fn scalar_docs() -> impl IntoResponse {
    let html = r#"
<!doctype html>
<html>
  <head>
    <title>Tekimax API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <style>
      /* Hide the 'Models' section in the sidebar to avoid confusion with AI Models */
      .sidebar-group:has(.sidebar-heading[aria-label="Models"]),
      .section-container:has(h1#models) {
        display: none !important;
      }
      /* Fallback for older/simpler implementations */
      /* Fallback for older/simpler implementations */
      [id^="model-"] { display: none !important; }
      
      /* Hide "Powered by Scalar" branding */
      .scalar-footer,
      .scalar-watermark,
      a[href*="scalar.com"] {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.yaml"
      data-configuration='{
        "layout": "modern",
        "theme": "solarized",
        "expandAllResponses": true,
        "hideClientButton": false,
        "showSidebar": true,
        "showDeveloperTools": "localhost",
        "showToolbar": "localhost",
        "operationTitleSource": "summary",
        "persistAuth": false,
        "telemetry": true,
        "isEditable": false,
        "isLoading": false,
        "hideModels": true,
        "documentDownloadType": "both",
        "hideTestRequestButton": false,
        "hideSearch": false,
        "showOperationId": false,
        "hideDarkModeToggle": false,
        "withDefaultFonts": true,
        "defaultOpenAllTags": false,
        "expandAllModelSections": false,
        "orderSchemaPropertiesBy": "alpha",
        "orderRequiredPropertiesFirst": true,
        "_integration": "html",
        "default": false,
        "slug": "api-1",
        "title": "Tekimax API Gateway",
        "logo": "/logo.png"
      }'></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
"#;
    Html(html)
}
