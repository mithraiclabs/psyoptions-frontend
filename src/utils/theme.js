import { createMuiTheme } from '@material-ui/core/styles'

const secondary = '#DD3E76'

const theme = createMuiTheme({
  gradients: {
    secondaryPrimary: 'linear-gradient(90deg, #DD3E76 -0.83%, #1D4DC9 100%)',
  },
  glow: '0 0 0px #11FFCC, 0 0 20px #0055CC, 0 0 50px #001199',
  typography: {
    fontFamily: 'JetBrains Mono, sans-serif',
  },
  palette: {
    type: 'dark',
    primary: {
      light: '#E4F5FF',
      main: '#8BEAFF',
      dark: '#1D4DC9',
      darker: '#05044D',
      contrastText: '#000',
    },
    secondary: {
      main: secondary,
      dark: '#750035',
      darker: '#24001A',
      contrastText: '#E4F5FF',
    },
    warning: {
      main: '#FAC265',
      dark: '#D18641',
    },
    success: {
      main: '#51F39C',
    },
    error: {
      main: secondary,
    },
    background: {
      light: '#2E2832',
      paper: '#2E2832',
      main: '#101017',
      default: '#101017',
    },
    border: {
      main: '#686775',
    },
    disabled: {
      main: '#373B40',
    },
    text: {
      primary: '#8BEAFF',
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
