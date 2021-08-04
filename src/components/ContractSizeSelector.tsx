import React from 'react'
import Select from './Select'

/**
 * Component for selecting supported contract sizes
 */
export const ContractSizeSelector: React.VFC<{
  options: {
    value: number
    text: string
  }[]
  onChange: (
    e: React.ChangeEvent<{
      name?: string
      value: string
    }>,
  ) => void
  value: number | string
}> = ({ options, onChange, value }) => {
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
      options={options}
    />
  )
}
