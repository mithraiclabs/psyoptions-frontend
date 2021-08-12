import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import { withStyles } from '@material-ui/core/styles'
import theme from '../../../utils/theme'

const borderLight = `1px solid ${theme.palette.background.paper}`

export const StyledTooltip = withStyles(() => ({
  tooltip: {
    backgroundColor: theme.palette.background.lighter,
    maxWidth: 370,
    fontSize: '13px',
    lineHeight: '18px',
  },
}))(Tooltip)

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
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    border: 'none',
    height: '48px',
    background: theme.palette.background.marketsCallPutRow,
  },
})(TableCell)

export const TCellLoading = withStyles({
  root: {
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    height: '48px',
    border: 'none',
    background: 'transparent',
  },
})(TableCell)

export const THeadCell = withStyles({
  root: {
    padding: '4px 7px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    height: '48px',
    border: 'none',
    borderTop: borderLight,
    borderBottom: borderLight,
    background: theme.palette.background.medium,
  },
})(TableCell)

export const THeadCellStrike = withStyles({
  root: {
    padding: '4px 7px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
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
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    height: '48px',
    border: 'none',
    width: '130px',
    background: theme.palette.background.paper,
  },
})(TableCell)

export const TRow = withStyles({
  hover: {
    backgroundColor: `${theme.palette.background.medium}`,
    '&:hover': {
      backgroundColor: `${theme.palette.background.lighter} !important`,
    },
  },
})(TableRow)
