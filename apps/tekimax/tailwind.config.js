/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'tekimax-navy': '#0a0e1a',
                'tekimax-blue': '#3b82f6',
                'tekimax-gold': '#f59e0b',
                'tekimax-orange': '#f59e0b',
            },
            fontFamily: {
                'barlow': ['Barlow', 'sans-serif'],
                'sora': ['Sora', 'sans-serif'],
                'display': ['Sora', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
