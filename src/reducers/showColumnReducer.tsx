import React, { createContext, useReducer } from 'react';

export interface ColumnState {
  showIV: boolean,
  showPriceChange: boolean,
  showVolume: boolean,
  showOI: boolean,
}

export type ColumnActions =
  | { type: 'SET_SHOW_IV', payload: boolean }
  | { type: 'SET_SHOW_PRICE_CHANGE', payload: boolean }
  | { type: 'SET_SHOW_VOLUME', payload: boolean }
  | { type: 'SET_SHOW_OI', payload: boolean }

export const initialColumnState: ColumnState = {
  showIV: true,
  showPriceChange: true,
  showVolume: true,
  showOI: true,
};

export function showColumnReducer(state: ColumnState, action: ColumnActions): ColumnState {
  switch (action.type) {
    case 'SET_SHOW_IV':
      console.log('setting show iv', action.payload)
      return { ...state, showIV: action.payload };
    case 'SET_SHOW_PRICE_CHANGE':
      return { ...state, showPriceChange: action.payload };
    case 'SET_SHOW_VOLUME':
      return { ...state, showVolume: action.payload };
    case 'SET_SHOW_OI':
      return { ...state, showOI: action.payload };
    default:
      console.log('using default')
      return state;
  }
}

export const ColumnSettingsContext = createContext<{
  state: ColumnState;
  dispatch: React.Dispatch<ColumnActions>;
}>({
  state: initialColumnState,
  dispatch: () => undefined,
})

export const ColumnSettingsProvider: React.FC<{ undefined }> = ({ children }) => {
  const [state, dispatch] = useReducer(showColumnReducer, initialColumnState);

  console.log('provider state', state.showIV)
  return (
    <ColumnSettingsContext.Provider value={{state, dispatch}}>
      <>{children}</>
    </ColumnSettingsContext.Provider>
  )
}

