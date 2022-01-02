import React from 'react';
import Hidden from '@material-ui/core/Hidden';
import Dialog, { DialogProps } from '@material-ui/core/Dialog';

const DialogFullscreenMobile: React.FC<DialogProps> = ({
  open,
  onClose,
  maxWidth,
  children,
  ...passThruProps
}) => (
  <>
    <Hidden smDown>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        {...passThruProps}
      >
        {children}
      </Dialog>
    </Hidden>
    <Hidden mdUp>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullScreen
        {...passThruProps}
      >
        {children}
      </Dialog>
    </Hidden>
  </>
);

export default DialogFullscreenMobile;
