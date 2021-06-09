import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import theme from '../../../utils/theme'

const borderLight = `1px solid ${theme.palette.background.paper}`

export const PageButton = withStyles({
  root: {
    padding: '12px',
    whiteSpace: 'nowrap',
    borderRadius: '40px',
    minWidth: '0px',
    width: '40px',
    height: '40px',
    margin: '0 4px',
  },
})(Button)

export const TCell = withStyles({
  root: {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    border: 'none',
    height: '48px',
    background: theme.palette.background.medium,
    opacity: 0.95
  },
})(TableCell)

export const TCellLoading = withStyles({
  root: {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
    background: theme.palette.background.medium,
  },
})(TableCell)

export const THeadCell = withStyles({
  root: {
    padding: '4px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
    borderTop: borderLight,
    borderBottom: borderLight,
    background: theme.palette.background.medium,
  },
})(TableCell)

export const THeadCellStrike = withStyles({
  root: {
    padding: '4px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
    borderTop: borderLight,
    borderBottom: borderLight,
    width: '130px',
    background: theme.palette.background.medium,
  },
})(TableCell)

export const TCellStrike = withStyles({
  root: {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
    width: '130px',
    background: theme.palette.background.paper,
  },
})(TableCell)

export const TRow = withStyles({
  hover: {
    '&:hover': {
      backgroundColor: `${theme.palette.background.lighter} !important`
    }
  }
})(TableRow)
