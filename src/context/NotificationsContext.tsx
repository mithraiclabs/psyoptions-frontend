import React, { useState, useCallback, useMemo, createContext } from 'react';
import { PsyOptionError } from '@mithraic-labs/psyoptions';
import TransactionError from '../utils/transactionErrors/TransactionError';
import { InstructionErrorResponse, NotificationSeverity } from '../types';
import useConnection from '../hooks/useConnection';

type UINotification = {
  link?: React.ReactNode;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  txid?: string;
};

export type UINotificationContext = {
  closeNotification: (index: any) => void;
  pushErrorNotification: (
    error: Error | InstructionErrorResponse | string,
  ) => void;
  pushNotification: (content: any) => void;
  notifications: UINotification[];
};

const noop = () => {};
const NotificationsContext = createContext<UINotificationContext>({
  closeNotification: noop,
  pushErrorNotification: noop,
  pushNotification: noop,
  notifications: [],
});

const NotificationsProvider: React.FC = ({ children }) => {
  const [notifications, setNotifications] = useState<UINotification[]>([
    // Examples of possible severity states:
    // {
    //   severity: 'success',
    //   message: 'Success',
    // },
    // {
    //   severity: 'info',
    //   message: 'Info',
    // },
    // {
    //   severity: 'error',
    //   message: 'Error',
    // },
    // {
    //   severity: 'warning',
    //   message: 'Warning',
    // },
  ]);
  const { endpoint } = useConnection();

  /**
   * Parse an instruction error and decode errors from known programs
   */
  const parseInstructionError = useCallback(
    (
      transactionError: TransactionError,
    ): {
      parsedError?: string;
      errorMessage: string;
    } => {
      const { transaction, instructionError } = transactionError;
      if (!instructionError) {
        return {
          errorMessage: `Unknown program error: ${instructionError}`,
        };
      }
      const [failedInstructionIndex, customError] = instructionError;
      const failedInstruction =
        transaction.instructions[failedInstructionIndex];
      // use the programId of the failed instruction to determine which program errored
      if (failedInstruction.programId.toString() === endpoint?.programId) {
        const parsedError = PsyOptionError[customError.Custom];
        return {
          parsedError,
          errorMessage: `PsyOptionsError: ${parsedError}`,
        };
      }
      return {
        errorMessage: `Other program error: ${instructionError}`,
      };
    },
    [endpoint],
  );

  // useCallback() and useMemo() to prevent whole page re-renders
  const pushNotification = useCallback(
    (content) =>
      setNotifications((_notifications) => {
        // remove processing tx's with same txids, i.e. after success
        const notifs = _notifications.filter(
          (notif) => notif.txid !== content.txid,
        );
        return [content, ...notifs];
      }),
    [],
  );

  /**
   * Special case for error notifications. We check if the error is a TransactionError
   * so we can decode error given the InstructionError. If it's not a TransactionError
   * then we just push the error's message as usual.
   */
  const pushErrorNotification = useCallback(
    (error: Error | InstructionErrorResponse | string) => {
      let content;
      // Log the error for dev debugging purposes
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
      if (error instanceof TransactionError) {
        const { errorMessage } = parseInstructionError(error);
        content = {
          severity: NotificationSeverity.ERROR,
          message: errorMessage,
        };
      } else {
        content = {
          severity: NotificationSeverity.ERROR,
          message: `${error}`,
        };
      }
      setNotifications((_notifications) => [content, ..._notifications]);
    },
    [parseInstructionError],
  );

  const closeNotification = useCallback((index) => {
    setNotifications((_notifications) =>
      _notifications.filter((_, i) => i !== index),
    );
  }, []);

  const value = useMemo(
    () => ({
      closeNotification,
      pushErrorNotification,
      pushNotification,
      notifications,
    }),
    [pushErrorNotification, pushNotification, closeNotification, notifications],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export { NotificationsContext, NotificationsProvider };
