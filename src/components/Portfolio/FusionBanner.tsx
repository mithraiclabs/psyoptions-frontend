import { Box, BoxProps, Typography } from '@material-ui/core';

const bannerStyle = {
  background: '#4222a2',
} as BoxProps;

export const FusionBanner: React.FC = () => {
  return (
    <a
      href="https://app.projectfusion.io/recover"
      target="_blank"
      rel="noreferrer"
    >
      <Box
        display="flex"
        flexGrow="1"
        justifyContent="center"
        p={1}
        sx={bannerStyle}
      >
        <Typography>
          Did you know that Fusion has a better experience for managing options?
          Click here to check it out
        </Typography>
      </Box>
    </a>
  );
};
