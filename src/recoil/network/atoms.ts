import { atom } from 'recoil';
import { networks } from '../../utils/networkInfo';

// Default to MAINNET
const MAINNET = networks[0];

export const activeNetwork = atom({
  key: 'activeNetwork',
  default: MAINNET,
});
