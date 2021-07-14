export interface ColumnState {
  showIV: boolean,
  showPriceChange: boolean,
  showVolume: boolean,
  showOI: boolean,
}

export type Action =
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

export function showColumnReducer(state: ColumnState, action: Action): ColumnState {
  switch (action.type) {
    case 'SET_SHOW_IV':
      return { ...state, showIV: action.payload };
    case 'SET_SHOW_PRICE_CHANGE':
      return { ...state, showPriceChange: action.payload };
    case 'SET_SHOW_VOLUME':
      return { ...state, showVolume: action.payload };
    case 'SET_SHOW_OI':
      return { ...state, showOI: action.payload };
    default:
      return state;
  }
}
