/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f8f3",
          100: "#dfeade",
          200: "#c2d7c0",
          300: "#97bb93",
          400: "#69976a",
          500: "#47774a",
          600: "#315d35",
          700: "#1b4332",
          800: "#17392b",
          900: "#142f25"
        },
        accent: {
          50: "#fff8ed",
          100: "#ffedd2",
          200: "#fed8a4",
          300: "#fdb968",
          400: "#fb9331",
          500: "#f97316",
          600: "#d97706",
          700: "#b45309",
          800: "#923f10",
          900: "#78350f"
        }
      },
      boxShadow: {
        panel: "0 18px 45px -22px rgba(15, 23, 42, 0.35)"
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top left, rgba(27,67,50,0.12), transparent 40%), linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)"
      },
      backgroundSize: {
        "grid-fade": "auto, 24px 24px, 24px 24px"
      }
    }
  },
  plugins: []
};
