import daisyui from "daisyui"
import themes, { black } from "daisyui/src/theming/themes"
import daisyUITheames from "daisyui/src/theming/themes"

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [
      daisyui,
  ],

  daisyui:{
    themes:[
      "light",
      {
        black:{
          ...daisyUITheames["black"],
          primary: "rgb(29, 155, 240)",
          secondary: "rgb(24, 24, 24)",
        },
      },
    ],
  },

}

