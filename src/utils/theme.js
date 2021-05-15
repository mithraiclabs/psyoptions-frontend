import { createMuiTheme } from '@material-ui/core/styles'

const theme = createMuiTheme({
  gradients: {
    secondary: 'linear-gradient(90deg, #24001A 0%, #790068 50%, #D18641 100%)',
    secondaryPrimary: 'linear-gradient(90deg, #DD3E76 -0.83%, #1D4DC9 100%)',
    warning: 'linear-gradient(90deg, #DC3E78 0%, #FA8965 100%)',
    error: 'linear-gradient(90deg, #790068 0%, #DD3E76 100%)',
    success: 'linear-gradient(90deg, #14758A 0%, #28C972 100%)',
    info: 'linear-gradient(90deg, #686775 0%, #9C9CB6 100%)',
  },
  glow: '0px 0px 20px #1D4DC9',
  typography: {
    fontFamily: 'Roboto, sans-serif',
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
      main: '#DD3E76',
      dark: '#750035',
      darker: '#24001A',
      contrastText: '#E4F5FF',
    },
    warning: {
      main: '#FAC265',
      dark: '#D18641',
      contrastText: '#E4F5FF',
    },
    success: {
      main: '#51F39C',
      contrastText: '#E4F5FF',
    },
    error: {
      main: '#DD3E76',
      contrastText: '#8BEAFF',
    },
    info: {
      main: '#1D4DC9',
      contrastText: '#E4F5FF',
    },
    background: {
      lighter: '#5C585F',
      light: '#36343E',
      paper: '#36343E',
      medium: '#2A2A34',
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
      primary: 'rgba(139, 234, 255, 0.9)',
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
