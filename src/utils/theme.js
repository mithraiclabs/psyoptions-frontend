import { createMuiTheme } from '@material-ui/core/styles'

const theme = createMuiTheme({
  glow: '0 0 0px #11FFCC, 0 0 20px #0055CC, 0 0 50px #001199',
  typography: {
    fontFamily: 'JetBrains Mono, sans-serif',
  },
  palette: {
    primary: {
      // light: will be calculated from palette.primary.main,
      main: '#8BEAFF',
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      // light: '#0066ff',
      main: '#DD3E76',
      dark: '#750035',
      // contrastText: '#ffcc00',
    },
    info: {
      main: '#FAC265',
      dark: '#D18641',
    },
    success: {
      main: '#51F39C',
    },
    error: {
      main: '#DD3E76',
    },
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: 3,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: 0.2,
  },
})

export default theme
