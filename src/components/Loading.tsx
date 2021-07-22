import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Box from '@material-ui/core/Box'

const useStyles = makeStyles(() => ({
  loading: {
    height: '12px',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
  },
  loadingInnerBar: {
    background: `linear-gradient(90deg, #383743 0%, #485C68 33.33%, #383743 66.66%, #485C68 100%)`,
    animation: '$myEffect 3s linear 0s infinite',
    width: '300%',
    height: '12px',
    position: 'absolute',
    transform: 'translateX(-66.66%)',
  },
  '@keyframes myEffect': {
    '0%': {
      transform: 'translateX(-66.66%)',
    },
    '100%': {
      transform: 'translateX(0%)',
    },
  },
}))

const Loading = () => {
  const styles = useStyles()
  return (
    <Box borderRadius={'20px'} className={styles.loading}>
      <Box className={styles.loadingInnerBar} />
    </Box>
  )
}

export default Loading
