/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary greens
          green:        '#1d7341',  
          'green-dark': '#1d7341',  
 
          // Neutrals
          cream:        '#E2D7AB',  
          'cream-light':'#F1EFC8',   
          offwhite:     '#f2f2f2',   
 
          // Foreground
          dark:         '#202020',  
        },
      },
    },
  },
  plugins: [],
}
 