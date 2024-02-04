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
                '0%, 100%': { opacity: '1' },
                '50%': { opacity: '0' },
            },
            blinkSec: {
                '0%, 100%': { opacity: '0' },
                '50%': { opacity: '1' },
            },
            flickerI: {
                '0%, 100%': { opacity: '0.4' },
                '5%': { opacity: '0.5' },
                '10%': { opacity: '0.6' },
                '15%': { opacity: '0.85' },
                '25%': { opacity: '0.5' },
                '30%': { opacity: '1' },
                '35%': { opacity: '0.1' },
                '40%': { opacity: '0.25' },
                '45%': { opacity: '0.5' },
                '60%': { opacity: '1' },
                '70%': { opacity: '0.85' },
                '80%': { opacity: '0.4' },
                '90%': { opacity: '0.5' },
            },
            
            flickerLG: {
                '0%, 100%': { opacity: '0.19' },
                '5%': { opacity: '0.2' },
                '10%': { opacity: '0.25' },
                '15%': { opacity: '0.35' },
                '25%': { opacity: '0.2' },
                '30%': { opacity: '0.4' },
                '35%': { opacity: '0.1' },
                '40%': { opacity: '0.25' },
                '45%': { opacity: '0.2' },
                '60%': { opacity: '0.4' },
                '70%': { opacity: '0.35' },
                '80%': { opacity: '0.4' },
                '90%': { opacity: '0.2' },
            },
            flickerH: {
                '0%, 100%': { opacity: '0.15' },
                '5%': { opacity: '0.2' },
                '10%': { opacity: '0.12' },
                '15%': { opacity: '0.2' },
                '25%': { opacity: '0.15' },
                '30%': { opacity: '0.4' },
                '35%': { opacity: '0.05' },
                '40%': { opacity: '0.12' },
                '45%': { opacity: '0.15' },
                '60%': { opacity: '0.3' },
                '70%': { opacity: '0.2' },
                '80%': { opacity: '0.3' },
                '90%': { opacity: '0.18' },
            },
        },
        animation: {
            blink: 'blinkKey 2s ease-in-out infinite',
            blinkSec: "blinkSec 2s ease-in-out infinite",
            flickerI: 'flickerI 2s linear reverse infinite',
            flickerLG: 'flickerLG 2s linear reverse infinite',
            flickerH: 'flickerH 2s linear reverse infinite',
        }
    },
    plugins: [
        require('tailwindcss-fluid-type'),
    ],
}

