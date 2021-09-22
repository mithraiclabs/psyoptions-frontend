import React from 'react';
import Hidden from '@material-ui/core/Hidden';
import Dialog from '@material-ui/core/Dialog';

const DialogFullscreenMobile: React.FC<{
  open: boolean;
  onClose: () => void;
  maxWidth: false | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}> = ({ open, onClose, maxWidth, children }) => (
  <>
    <Hidden smDown>
      <Dialog open={open} onClose={onClose} maxWidth={maxWidth}>
        {children}
      </Dialog>
    </Hidden>
    <Hidden mdUp>
      <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullScreen>
        {children}
      </Dialog>
    </Hidden>
  </>
);

export default DialogFullscreenMobile;
