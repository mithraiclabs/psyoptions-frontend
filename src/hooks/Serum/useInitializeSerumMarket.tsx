import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import React, { useCallback } from 'react';
import Link from '@material-ui/core/Link';
import { instructions } from '@mithraic-labs/psy-american';
import useConnection from '../useConnection';
import useNotifications from '../useNotifications';
import { useAmericanPsyOptionsProgram } from '../useAmericanPsyOptionsProgram';
import { NotificationSeverity } from '../../types';
import { buildSolanaExplorerUrl } from '../../utils/solanaExplorer';

export const useInitializeSerumMarket = (): ((options: {
  optionMarketKey: PublicKey;
  baseMintKey: PublicKey;
  quoteMintKey: PublicKey;
  quoteLotSize: BN;
}) => Promise<[PublicKey, PublicKey] | null>) => {
  const program = useAmericanPsyOptionsProgram();
  const { dexProgramId } = useConnection();
  const { pushErrorNotification, pushNotification } = useNotifications();

  return useCallback(
    async ({
      optionMarketKey,
      baseMintKey,
      quoteMintKey,
      quoteLotSize,
    }: {
      optionMarketKey: PublicKey;
      baseMintKey: PublicKey;
      quoteMintKey: PublicKey;
      quoteLotSize: BN;
    }) => {
      try {
        // baseLotSize should be 1 -- the options market token doesn't have decimals
        const baseLotSize = new BN('1');
        pushNotification({
          severity: NotificationSeverity.INFO,
          message: 'Processing: Initialize Serum Market',
        });

        const { serumMarketKey, tx } = await instructions.initializeSerumMarket(
          program,
          {
            optionMarketKey,
            optionMint: baseMintKey,
            pcDustThreshold: new BN(100),
            pcLotSize: quoteLotSize,
            pcMint: quoteMintKey,
            serumProgramKey: dexProgramId,
          },
        );
        const explorerUrl = buildSolanaExplorerUrl(tx);
        pushNotification({
          severity: NotificationSeverity.SUCCESS,
          message: 'Successfully created SerumMarket',
          link: (
            <Link href={explorerUrl} target="_new">
              View on Solana Explorer
            </Link>
          ),
          tx,
        });

        return [serumMarketKey, dexProgramId];
      } catch (error) {
        pushErrorNotification(error);
      }
      return null;
    },
    [dexProgramId, program, pushNotification, pushErrorNotification],
  );
};
