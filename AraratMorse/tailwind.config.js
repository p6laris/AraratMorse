/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.{razor,html,cshtml}"],
    theme: {

        extend: {
            fontFamily: {
                'sans': "'Exo 2'",
            }
        },
        boxShadow: {
            'top': '-25px -12px 23px -12px rgba(0,0,0,0.24)',
        },
        keyframes: {
            blinkKey: {
                '0%, 100%': {opacity: '1'},
                '50%': {opacity: '0'},
            }
        },
        animation: {
            blink: 'blinkKey 2s ease-in-out infinite'
        }
    },
    plugins: [
        require('tailwindcss-fluid-type'),
    ],
}

