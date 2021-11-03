import React, { createContext, useContext, useReducer } from 'react'
import type { Dispatch } from 'react'

type FormState = {
  tokenSymbol: string
  direction: 'up' | 'down' | ''
  expirationUnixTimestamp: number
  strike: number
  orderSize: number
  orderType: 'limit' | 'market'
  limitPrice: number | null,
  contractSize: number,
}

type ContextValue = {
  state: FormState
  dispatch: Dispatch<UpdateFormAction>
}

type UpdateFormAction = {
  key: string
  value: unknown
}

type UpdateFormDispatcher = (key: string, value: any) => void

const initialState: FormState = {
  tokenSymbol: '',
  direction: '',
  expirationUnixTimestamp: 0,
  strike: 0,
  orderSize: 0,
  orderType: 'limit',
  limitPrice: 0,
  contractSize: 0.01,
}

// Simple reducer that replaces key/value pairs of the form state
const formReducer = (state: FormState, action: UpdateFormAction) => {
  return {
    ...state,
    [action.key]: action.value,
  }
}

export const SimpleUIFormContext = createContext<ContextValue>({
  state: initialState,
  dispatch: () => {},
})

export const SimpleUIFormProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(formReducer, initialState)

  return (
    <SimpleUIFormContext.Provider value={{ state, dispatch }}>
      {children}
    </SimpleUIFormContext.Provider>
  )
}

export const useFormState = (): FormState => {
  const { state } = useContext(SimpleUIFormContext)

  return state
}

export const useUpdateForm = (): UpdateFormDispatcher => {
  const { dispatch } = useContext(SimpleUIFormContext)

  return (key, value) => dispatch({ key, value })
}
