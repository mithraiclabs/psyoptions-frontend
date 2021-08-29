import TableCell from '@material-ui/core/TableCell';
import { withStyles } from '@material-ui/core/styles';
import theme from '../../utils/theme';

const borderLight = `1px solid ${theme.palette.background.paper}`;

export const TCell = withStyles({
  root: {
    padding: '8px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    border: 'none',
    height: '52px',
    background: (theme.palette.background as any).medium, // Todo fix this type
  },
})(TableCell);

export const THeadCell = withStyles({
  root: {
    padding: '4px 12px',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    height: '48px',
    border: 'none',
    borderTop: borderLight,
    borderBottom: borderLight,
    background: (theme.palette.background as any).medium,
  },
})(TableCell);
