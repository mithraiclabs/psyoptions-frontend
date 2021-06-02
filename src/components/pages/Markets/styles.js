import TableCell from '@material-ui/core/TableCell'
import { withStyles } from '@material-ui/core/styles'
import theme from '../../../utils/theme'

const borderLight = `1px solid ${theme.palette.background.paper}`

export const TCell = withStyles({
  root: {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    border: 'none',
    height: '48px',
    background: theme.palette.background.medium,
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
