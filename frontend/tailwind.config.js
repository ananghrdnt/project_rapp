/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        primaryBlue: "#348CD4",
        greenBright: "#21C11B",
        redHigh: "#ff4d4f",
        yellowMid: "#fadb14",
        greenLow: "#52c41a",
        blueView: "#2196f3",
        blueEdit: "#1976d2",
        redDelete: "#e53935",
        grayBg: "#f7f8fa",
      },
      fontSize: {
        xs10: "10px",
        xs11: "11px",
        sm13: "13px",
        sm14: "14px",
      },
      spacing: {
        px1: "4px",
        px2: "6px",
        px3: "10px",
        px4: "12px",
      },
      borderRadius: {
        card: "8px",
        btn: "6px",
        badge: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.1)",
        modal: "0 2px 8px rgba(0,0,0,0.2)",
      },
      maxWidth: {
        remark: "250px",
      },
       fontFamily: {
        sans: ["Poppins", "sans-serif"], // ✅ Tambahan font Poppins
      },
    },
  },
  plugins: [],
}
