import React from 'react'
import Select from './Select'

const supportedSizes = [
  {
    value: 100,
    text: '100',
  },
  {
    value: 10,
    text: '10',
  },
  {
    value: 1,
    text: '1',
  },
  {
    value: 0.1,
    text: '0.1',
  },
]

/**
 * Component for selecting supported contract sizes
 */
export const ContractSizeSelector: React.VFC<{
  onChange: (
    e: React.ChangeEvent<{
      name?: string
      value: string
    }>,
  ) => void
  value: number | string
}> = ({ onChange, value }) => {
  return (
    <Select
      formControlOptions={{
        variant: 'filled',
        style: {
          minWidth: '100%',
        },
      }}
      label="Contract Size"
      value={value}
      onChange={onChange}
      options={supportedSizes}
    />
  )
}
