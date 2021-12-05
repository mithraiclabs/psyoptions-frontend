import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BN from 'bn.js';
import {
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  Connection,
} from '@solana/web3.js';
import CircularProgress from '@material-ui/core/CircularProgress';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import { useRecoilValue } from 'recoil';
import theme from '../../utils/theme';
import useNotifications from '../../hooks/useNotifications';
import useConnection from '../../hooks/useConnection';
import useAssetList from '../../hooks/useAssetList';
import useSendTransaction from '../../hooks/useSendTransaction';
import useOwnedTokenAccounts from '../../hooks/useOwnedTokenAccounts';
import { createAssociatedTokenAccountInstruction } from '../../utils/instructions';
import { buildAirdropTokensIx } from '../../utils/airdropInstructions';
import Page from '../../components/pages/Page';
import { TokenAccount } from '../../types';
import { useHistory } from 'react-router-dom';
import GokiButton from '../../components/GokiButton';
import { useConnectedWallet } from '@saberhq/use-solana';
import useWalletInfo from '../../hooks/useWalletInfo';
import { activeNetwork } from '../../recoil';

const darkBorder = `1px solid ${theme.palette.background.main}`;

const getHighestAccount = (accounts: TokenAccount[]) => {
  if (accounts.length === 0) return undefined;
  if (accounts.length === 1) return accounts[0];
  return accounts.sort((a, b) => b.amount - a.amount)[0];
};

const LoadingAirdrop: React.VFC = () => (
  <Box width="160px" textAlign="center" padding="6px">
    <CircularProgress size={32} />
  </Box>
);

const Faucets: React.VFC = () => {
  const history = useHistory();
  const endpoint = useRecoilValue(activeNetwork);
  const { connection } = useConnection();
  useEffect(() => {
    if (endpoint?.name !== 'Devnet') {
      history.replace('/markets');
    }
  }, [endpoint?.name, history]);
  const { pushErrorNotification } = useNotifications();
  const wallet = useConnectedWallet();
  const { balance: solBalance } = useWalletInfo();
  const { supportedAssets: assets } = useAssetList();
  const { sendTransaction } = useSendTransaction();
  const { ownedTokenAccounts: accounts, subscribeToTokenAccount } =
    useOwnedTokenAccounts();

  const [loadingBTC, setLoadingBTC] = useState(false);
  const [loadingPSY, setLoadingPSY] = useState(false);
  const [loadingUSDC, setLoadingUSDC] = useState(false);
  const [loadingSOL, setLoadingSOL] = useState(false);

  const BTC = useMemo(() => {
    return {
      ...(assets.find((a) => a.tokenSymbol === 'BTC') || {}),
      faucetAddress: process.env.REACT_APP_DEVNET_FAUCET_BTC,
    };
  }, [assets]);
  const PSY = useMemo(() => {
    return {
      ...(assets.find((a) => a.tokenSymbol === 'PSY') || {}),
      faucetAddress: process.env.REACT_APP_DEVNET_FAUCET_PSY,
    };
  }, [assets]);
  const USDC = useMemo(() => {
    return {
      ...(assets.find((a) => a.tokenSymbol === 'USDC') || {}),
      faucetAddress: process.env.REACT_APP_DEVNET_FAUCET_USDC,
    };
  }, [assets]);

  const btcAccount = useMemo(() => {
    return getHighestAccount(accounts[BTC?.mintAddress ?? ''] || []);
  }, [accounts, BTC]);
  const psyAccount = useMemo(() => {
    return getHighestAccount(accounts[PSY?.mintAddress ?? ''] || []);
  }, [accounts, PSY]);
  const usdcAccount = useMemo(() => {
    return getHighestAccount(accounts[USDC?.mintAddress ?? ''] || []);
  }, [accounts, USDC]);

  const btcBalance = useMemo(() => {
    return btcAccount ? btcAccount.amount * 10 ** -(BTC?.decimals ?? 0) : 0;
  }, [btcAccount, BTC]);
  const psyBalance = useMemo(() => {
    return psyAccount ? psyAccount.amount * 10 ** -(PSY?.decimals ?? 0) : 0;
  }, [psyAccount, PSY]);
  const usdcBalance = useMemo(() => {
    return usdcAccount ? usdcAccount.amount * 10 ** -(USDC?.decimals ?? 0) : 0;
  }, [usdcAccount, USDC]);

  const handleClaimSOL = useCallback(async () => {
    if (!endpoint || !wallet?.publicKey) {
      return;
    }
    setLoadingSOL(true);
    try {
      const conn = new Connection(endpoint.fallbackUrl, {
        commitment: 'confirmed',
      });
      await conn.requestAirdrop(wallet.publicKey, 5 * LAMPORTS_PER_SOL);
    } catch (err) {
      pushErrorNotification(err);
    }
    setLoadingSOL(false);
  }, [endpoint, wallet?.publicKey, pushErrorNotification]);

  const createAccountsAndAirdrop = useCallback(
    async (
      asset: any,
      existingAccount: TokenAccount | undefined,
      amount: number,
      message: string,
    ) => {
      if (!connection || !wallet?.publicKey) {
        return;
      }
      try {
        let receivingAccountPublicKey = existingAccount?.pubKey;
        const tx = new Transaction();
        const mintPublicKey = new PublicKey(asset.mintAddress);

        if (!existingAccount) {
          const [ix, associatedTokenPublicKey] =
            await createAssociatedTokenAccountInstruction({
              payer: wallet.publicKey,
              owner: wallet.publicKey,
              mintPublicKey,
            });
          tx.add(ix);
          receivingAccountPublicKey = associatedTokenPublicKey;
          subscribeToTokenAccount(receivingAccountPublicKey);
        }

        const amountToDrop = new BN(amount).mul(
          new BN(10).pow(new BN(asset.decimals)),
        );

        const airdropIx = await buildAirdropTokensIx(
          amountToDrop,
          undefined as unknown as PublicKey, // admin key, not needed
          mintPublicKey,
          receivingAccountPublicKey as PublicKey,
          new PublicKey(asset.faucetAddress),
        );
        tx.add(airdropIx);

        await sendTransaction({
          transaction: tx,
          wallet,
          signers: [],
          connection,
          sendingMessage: `Processing: ${message}`,
          successMessage: `Confirmed: ${message}`,
        });
      } catch (err) {
        pushErrorNotification(err);
      }
    },
    [
      connection,
      wallet,
      subscribeToTokenAccount,
      sendTransaction,
      pushErrorNotification,
    ],
  );

  const handleClaimBTC = useCallback(async () => {
    setLoadingBTC(true);
    await createAccountsAndAirdrop(BTC, btcAccount, 10, 'Claim 10 BTC');
    setLoadingBTC(false);
  }, [createAccountsAndAirdrop, BTC, btcAccount]);

  const handleClaimUSDC = useCallback(async () => {
    setLoadingUSDC(true);
    await createAccountsAndAirdrop(
      USDC,
      usdcAccount,
      100_000,
      'Claim 100,000 USDC',
    );
    setLoadingUSDC(false);
  }, [createAccountsAndAirdrop, USDC, usdcAccount]);

  const handleClaimPSY = useCallback(async () => {
    setLoadingPSY(true);
    await createAccountsAndAirdrop(PSY, psyAccount, 1000, 'Claim 1,000 PSY');
    setLoadingPSY(false);
  }, [createAccountsAndAirdrop, PSY, psyAccount]);

  return (
    <Page>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        minHeight="100%"
        pb={[0, 0, 4]}
      >
        <Paper
          style={{
            width: '100%',
            maxWidth: '500px',
            minHeight: '360px',
          }}
        >
          <Box p={2} textAlign="center" padding="6px">
            <h2 style={{ margin: '10px 0 0' }}>Devnet Faucets</h2>
          </Box>
          <Box p={2}>
            Claim Devnet SPL tokens here. These faucets airdrop Devnet SPLs for
            testing only, they are not real and have no value.
          </Box>
          {wallet?.connected ? (
            <>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png" />
                  <Box px={2}>
                    Devnet SOL
                    <br />
                    Balance:{' '}
                    {solBalance
                      ? (solBalance / LAMPORTS_PER_SOL).toFixed(2)
                      : 'Loading...'}
                  </Box>
                </Box>
                {loadingSOL ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimSOL}
                  >
                    Claim 5 SOL
                  </Button>
                )}
              </Box>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src={USDC?.icon} />
                  <Box px={2}>
                    Devnet USDC
                    <br />
                    Balance: {usdcBalance.toFixed(2)}
                  </Box>
                </Box>
                {loadingUSDC ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimUSDC}
                  >
                    Claim 100,000 USDC
                  </Button>
                )}
              </Box>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src={BTC?.icon} />
                  <Box px={2}>
                    Devnet BTC
                    <br />
                    Balance: {btcBalance.toFixed(2)}
                  </Box>
                </Box>
                {loadingBTC ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimBTC}
                  >
                    Claim 10 BTC
                  </Button>
                )}
              </Box>
              <Box
                p={2}
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                style={{ borderTop: darkBorder }}
              >
                <Box flexDirection="row" display="flex" alignItems="center">
                  <Avatar src={PSY?.icon} />
                  <Box px={2}>
                    Devnet PSY
                    <br />
                    Balance: {psyBalance.toFixed(2)}
                  </Box>
                </Box>
                {loadingPSY ? (
                  <LoadingAirdrop />
                ) : (
                  <Button
                    style={{ width: '160px' }}
                    color="primary"
                    variant="outlined"
                    onClick={handleClaimPSY}
                  >
                    Claim 1,000 PSY
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Box
              p="80px"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <GokiButton />
            </Box>
          )}
        </Paper>
      </Box>
    </Page>
  );
};

export default Faucets;
