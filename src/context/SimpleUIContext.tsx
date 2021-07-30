import React, { createContext, useContext, useReducer } from 'react'
import type { Dispatch } from 'react'

type FormState = Record<string, unknown>

type ContextValue = {
  state: FormState
  dispatch: Dispatch<UpdateFormAction>
}

type UpdateFormAction = {
  key: string
  value: unknown
}

type UpdateFormDispatcher = (key: string, value: any) => void

// Simple reducer that replaces key/value pairs in the existing state
const formReducer = (state: FormState, action: UpdateFormAction) => {
  return {
    ...state,
    [action.key]: action.value,
  }
}

const initialState: FormState = {}

export const SimpleUIFormContext = createContext<ContextValue>({
  state: {},
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
