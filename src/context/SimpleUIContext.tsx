import React, {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from 'react';
import type { Dispatch } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BigNumber } from 'bignumber.js';

type FormState = {
  tokenSymbol: string;
  underlyingAssetMint: PublicKey | null;
  direction: 'up' | 'down' | '';
  expirationUnixTimestamp: number;
  strike: BigNumber;
  orderSize: number;
  orderType: 'limit' | 'market';
  optionKey: PublicKey | null;
  limitPrice: number | null;
  serumMarketAddress: PublicKey | null;
  contractSize: number;
};

type ContextValue = {
  state: FormState;
  dispatch: Dispatch<UpdateFormAction>;
};

type UpdateFormAction = {
  key: string;
  value: unknown;
};

type UpdateFormDispatcher = (key: string, value: any) => void;

const initialState: FormState = {
  underlyingAssetMint: null,
  tokenSymbol: '',
  direction: '',
  expirationUnixTimestamp: 0,
  strike: new BigNumber(0),
  orderSize: 0,
  orderType: 'limit',
  optionKey: null,
  limitPrice: 0,
  contractSize: 0.01,
  serumMarketAddress: null,
};

// Simple reducer that replaces key/value pairs of the form state
const formReducer = (state: FormState, action: UpdateFormAction) => {
  return {
    ...state,
    [action.key]: action.value,
  };
};

export const SimpleUIFormContext = createContext<ContextValue>({
  state: initialState,
  dispatch: () => {},
});

export const SimpleUIFormProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  return (
    <SimpleUIFormContext.Provider value={{ state, dispatch }}>
      {children}
    </SimpleUIFormContext.Provider>
  );
};

export const useFormState = (): FormState => {
  const { state } = useContext(SimpleUIFormContext);

  return state;
};

export const useUpdateForm = (): UpdateFormDispatcher => {
  const { dispatch } = useContext(SimpleUIFormContext);

  return useCallback(
    (key: keyof FormState, value) => dispatch({ key, value }),
    [dispatch],
  );
};
