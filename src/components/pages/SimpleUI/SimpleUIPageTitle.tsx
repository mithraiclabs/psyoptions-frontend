import React, { memo } from 'react'
import { useLocation } from 'react-router-dom'

export const PageTitle: React.FC = () => {
  const { pathname } = useLocation()

  let pageTitle = ''
  if (pathname.match(/\/simple\/choose-asset\/?$/)) {
    pageTitle = 'Choose An Asset'
  }
  if (pathname.match(/\/simple\/up-or-down\/?$/)) {
    pageTitle = `I think it's going...`
  }
  if (pathname.match(/\/simple\/choose-expiration\/?$/)) {
    pageTitle = `On or before this date`
  }
  if (pathname.match(/\/simple\/choose-strike\/?$/)) {
    pageTitle = `Strike Price`
  }

  return <h3 style={{ margin: 0 }}>{pageTitle}</h3>
}

export default memo(PageTitle)
