import TableCell from '@material-ui/core/TableCell'
import { withStyles } from '@material-ui/core/styles'
import theme from '../../utils/theme'

export const TCell = withStyles({
  root: {
    padding: '8px 16px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    border: 'none',
    height: '52px',
    background: (theme.palette.background as any).medium, // Todo fix this type
  },
})(TableCell)

export const THeadCell = withStyles({
  root: {
    padding: '4px 16px',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    height: '48px',
    border: 'none',
  },
})(TableCell)
