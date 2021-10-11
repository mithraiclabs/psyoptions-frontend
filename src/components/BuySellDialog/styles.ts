import { withStyles } from '@material-ui/core/styles';
import Button, { ButtonProps } from '@material-ui/core/Button';
import FilledInput from '@material-ui/core/FilledInput';
import theme from '../../utils/theme';

export const StyledFilledInput = withStyles({
  root: {
    borderRadius: 0,
    width: '100%',
    minWidth: '100px',
  },
  input: {
    padding: '8px 12px !important',
  },
})(FilledInput);

export const PlusMinusButton = withStyles({
  root: {
    borderRadius: 0,
    minWidth: '38px',
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    marginLeft: '2px',
    fontWeight: 700,
    fontSize: '24px',
    lineHeight: '24px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
  },
})(Button);

type FakeButtonProps = ButtonProps & {
  fakedisabled: number;
};

export const StyledSellButton = withStyles({
  // The fakedisabled prop is a hack/workaround
  // to make the button look disabled but still show tooltips on hover
  // Make sure to remove the onClick handler via props
  root: ({ fakedisabled }: FakeButtonProps) =>
    fakedisabled
      ? {
          backgroundColor: theme.palette.error.dark,
          color: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: theme.palette.error.dark,
          },
        }
      : {
          backgroundColor: theme.palette.error.main,
          '&:hover': {
            backgroundColor: theme.palette.error.light,
          },
        },
})(Button);

export const StyledBuyButton = withStyles({
  // The fakedisabled prop is a hack/workaround
  // to make the button look disabled but still show tooltips on hover
  // Make sure to remove the onClick handler via props
  root: ({ fakedisabled }: FakeButtonProps) =>
    fakedisabled
      ? {
          backgroundColor: theme.palette.success.dark,
          color: 'rgba(255, 255, 255, 0.3)',
          '&:hover': {
            backgroundColor: theme.palette.success.dark,
          },
        }
      : {
          backgroundColor: theme.palette.success.main,
          '&:hover': {
            backgroundColor: theme.palette.success.light,
          },
          color: theme.palette.background.main,
        },
})(Button);
