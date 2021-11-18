import TableRow from '@material-ui/core/TableRow';
import { serumInstructions } from '@mithraic-labs/psy-american';
import { OpenOrders } from '@project-serum/serum';
import { PublicKey, Transaction } from '@solana/web3.js';
import * as Sentry from '@sentry/react';
import React, { useCallback, useState } from 'react';
import { useAmericanPsyOptionsProgram } from '../../hooks/useAmericanPsyOptionsProgram';
import useConnection from '../../hooks/useConnection';
import { TCell } from '../StyledComponents/Table/TableStyles';
import TxButton from '../TxButton';
import useNotifications from '../../hooks/useNotifications';

export const CloseableOpenOrderAccountRow: React.VFC<{
  openOrder: OpenOrders;
}> = ({ openOrder }) => {
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const { pushErrorNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const closeOpenOrderAccount = useCallback(async () => {
    if (!program || !dexProgramId) {
      return;
    }
    setLoading(true);
    try {
      const marketProxy = await serumInstructions.marketLoader(
        program,
        PublicKey.default, // only needed for prune
        0, // only needed for prune
        dexProgramId,
        openOrder.market,
      );
      const closeOpenOrderIx = marketProxy.instruction.closeOpenOrders(
        openOrder.publicKey,
        openOrder.owner,
        program.provider.wallet.publicKey,
      );
      const tx = new Transaction().add(closeOpenOrderIx);
      await program.provider.send(tx);
    } catch (err) {
      pushErrorNotification(err);
      Sentry.captureException(err);
    }
    setLoading(false);
  }, [
    dexProgramId,
    openOrder.market,
    openOrder.owner,
    openOrder.publicKey,
    program,
    pushErrorNotification,
  ]);
  return (
    <TableRow>
      <TCell>{openOrder.market.toString()}</TCell>
      <TCell>{openOrder.publicKey.toString()}</TCell>
      <TCell align="right">
        <TxButton
          variant="outlined"
          color="primary"
          onClick={closeOpenOrderAccount}
          loading={loading}
        >
          {loading ? 'Closing' : 'Close'}
        </TxButton>
      </TCell>
    </TableRow>
  );
};
