import { Button, DialogActions } from '@material-ui/core';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import React, { createContext, useCallback, useContext } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import DialogFullscreenMobile from './DialogFullscreenMobile';

export const ManualExerciseWarning: React.VFC = () => {
  const [open, setOpen] = useManualExerciseWarning();
  const [hasAcknowledged, setHasAcknowledged] = useLocalStorageState(
    'dismissedManualExerciseWarning',
    false,
  );
  const dismiss = useCallback(() => {
    setHasAcknowledged(true);
    setOpen(false);
  }, [setHasAcknowledged, setOpen]);

  return (
    <DialogFullscreenMobile
      disableBackdropClick
      disableEscapeKeyDown
      open={open && !hasAcknowledged}
      onClose={dismiss}
      maxWidth="md"
    >
      <DialogTitle>Manual Exercise Only</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Due to limitations from decentralization, the PsyOptions American
          protocol does NOT support auto exercising of options upon expiration.
          Once Option Tokens are purchased, it is entirely up to the owner of
          the wallet to manually exercise prior to expiration.
        </DialogContentText>
        <h5>YOU MUST EXERCISE YOURSELF</h5>
        <a
          href="https://discord.gg/dm3cYWnURg"
          rel="noreferrer"
          target="_blank"
        >
          Join the PsyOptions Discord for expiration updates and reminders
        </a>
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss} color="primary">
          I understand
        </Button>
      </DialogActions>
    </DialogFullscreenMobile>
  );
};

const ManualExerciseWarningContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, () => {}]);

export const ManualExerciseWarningProvider =
  ManualExerciseWarningContext.Provider;

export const useManualExerciseWarning = () =>
  useContext(ManualExerciseWarningContext);
