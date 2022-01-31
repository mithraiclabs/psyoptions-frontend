import React, { useEffect } from 'react';
import Brightness1 from '@material-ui/icons/Brightness1';
import { Box, Button } from '@material-ui/core';
import GokiButton from './GokiButton';
import { useConnectedWallet, useSolana } from '@saberhq/use-solana';
import theme from '../utils/theme';
import { OptionMarket } from '@mithraic-labs/psy-american';
import { ProgramAccount } from '@project-serum/anchor';
import {
  selectAllOptions,
  quoteMint,
  activeNetwork,
  useAddUniqueOpenOrdersByOptionKey,
  useInsertOptions,
} from '@/recoil';
import { useAmericanPsyOptionsProgram } from '@/hooks/useAmericanPsyOptionsProgram';
import { useRecoilValue } from 'recoil';
import { getSupportedMarketsByNetwork } from '@/utils/networkInfo';
import { serumUtils } from '@mithraic-labs/psy-american';
import useConnection from '../hooks/useConnection';

const WalletStatus: React.FC = () => {
  const { disconnect } = useSolana();
  const { dexProgramId } = useConnection();
  const wallet = useConnectedWallet();
  const program = useAmericanPsyOptionsProgram();
  const upsertOptions = useInsertOptions(true);
  const currentoptions = useRecoilValue(selectAllOptions);
  const _quoteMint = useRecoilValue(quoteMint);
  const endpoint = useRecoilValue(activeNetwork);
  const insertOpenOrdersByOptionKey = useAddUniqueOpenOrdersByOptionKey();

  const pubKeyB58 =
    wallet?.publicKey &&
    wallet.publicKey.toBase58 &&
    wallet.publicKey.toBase58().slice(0, 5);

  useEffect(() => {
    (async () => {
      const options = (await program?.account.optionMarket.all()) as
        | ProgramAccount<OptionMarket>[]
        | null;

      if (options) {
        // update the option state
        upsertOptions(options);
      }
    })();
  }, [wallet?.publicKey, program, upsertOptions]);

  useEffect(() => {
    // TODO should clear the state when the program changes because the wallet changes
    if (program && dexProgramId && _quoteMint) {
      const supportedMarkets = getSupportedMarketsByNetwork(endpoint.name);
      (async () => {
        const ordersByOption = await serumUtils.findOpenOrdersForOptionMarkets(
          program,
          dexProgramId,
          currentoptions.map((o) => o.key),
          _quoteMint,
          supportedMarkets,
        );
        // @ts-ignore
        insertOpenOrdersByOptionKey(ordersByOption);
      })();
    }
  }, [
    _quoteMint,
    dexProgramId,
    endpoint.name,
    insertOpenOrdersByOptionKey,
    currentoptions,
    program,
  ]);

  return wallet?.connected ? (
    <Button onClick={disconnect}>
      <Box pr={2}>
        <Brightness1
          style={{
            fontSize: 12,
            color: theme.palette.success.main,
          }}
        />
      </Box>
      {`Disconnect ${pubKeyB58}...`}
    </Button>
  ) : (
    <GokiButton />
  );
};

export default WalletStatus;
