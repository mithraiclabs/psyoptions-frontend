import React from 'react';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import SvgIcon from '@material-ui/core/SvgIcon';
import TelegramIcon from '@material-ui/icons/Telegram';
import TwitterIcon from '@material-ui/icons/Twitter';
import GitHubIcon from '@material-ui/icons/GitHub';

const Footer = () => (
  <Box p={3}>
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="center"
      fontSize={13}
    >
      <Box px={1}>made by mithraiclabs</Box>
      {' | '}
      <Box px={1}>
        <Link
          color="primary"
          href="https://docs.google.com/forms/d/e/1FAIpQLSdJTqU3eg5dvxNm2KFcQM_zWibdoMKVW3Szjy3V0XOKk4P9jA/viewform"
          target="_blank"
          rel="noopener"
        >
          contact form
        </Link>
      </Box>
      {' | '}
      <Box px={1}>
        <Link
          color="primary"
          href="https://docs.psyoptions.io/"
          target="_blank"
          rel="noopener"
        >
          docs
        </Link>
      </Box>
      {' | '}
      <Box px={1}>
        <Link
          color="primary"
          href="https://jobs.solana.com/companies/psyoptions"
          target="_blank"
          rel="noopener"
        >
          careers
        </Link>
      </Box>
    </Box>
    <Box
      py={1}
      fontSize={13}
      display="flex"
      flexDirection={'row'}
      alignItems="center"
      justifyContent="center"
    >
      <Box px={1}>
        <Link
          color="primary"
          href="https://twitter.com/PsyOptions"
          target="_blank"
          rel="noopener"
        >
          <TwitterIcon fontSize="small" />
        </Link>
      </Box>
      <Box px={1}>
        <Link
          color="primary"
          href="https://github.com/mithraiclabs"
          target="_blank"
          rel="noopener"
        >
          <GitHubIcon fontSize="small" />
        </Link>
      </Box>
      <Box px={1}>
        <Link
          color="primary"
          href="https://t.me/psyoptions"
          target="_blank"
          rel="noopener"
        >
          <TelegramIcon fontSize="small" />
        </Link>
      </Box>
      <Box px={1}>
        <Link
          color="primary"
          href="https://discord.gg/MgDdJKgZJc"
          target="_blank"
          rel="noopener"
        >
          <SvgIcon viewBox="0 -5 24 30" fontSize="small">
            <path d="m3.58 21.196h14.259l-.681-2.205 1.629 1.398 1.493 1.338 2.72 2.273v-21.525c-.068-1.338-1.22-2.475-2.648-2.475l-16.767.003c-1.427 0-2.585 1.139-2.585 2.477v16.24c0 1.411 1.156 2.476 2.58 2.476zm10.548-15.513-.033.012.012-.012zm-7.631 1.269c1.833-1.334 3.532-1.27 3.532-1.27l.137.135c-2.243.535-3.26 1.537-3.26 1.537s.272-.133.747-.336c3.021-1.188 6.32-1.102 9.374.402 0 0-1.019-.937-3.124-1.537l.186-.183c.291.001 1.831.055 3.479 1.26 0 0 1.844 3.15 1.844 7.02-.061-.074-1.144 1.666-3.931 1.726 0 0-.472-.534-.808-1 1.63-.468 2.24-1.404 2.24-1.404-.535.337-1.023.537-1.419.737-.609.268-1.219.4-1.828.535-2.884.468-4.503-.315-6.033-.936l-.523-.266s.609.936 2.174 1.404c-.411.469-.818 1.002-.818 1.002-2.786-.066-3.802-1.806-3.802-1.806 0-3.876 1.833-7.02 1.833-7.02z" />
            <path d="m14.308 12.771c.711 0 1.29-.6 1.29-1.34 0-.735-.576-1.335-1.29-1.335v.003c-.708 0-1.288.598-1.29 1.338 0 .734.579 1.334 1.29 1.334z" />
            <path d="m9.69 12.771c.711 0 1.29-.6 1.29-1.34 0-.735-.575-1.335-1.286-1.335l-.004.003c-.711 0-1.29.598-1.29 1.338 0 .734.579 1.334 1.29 1.334z" />
          </SvgIcon>
        </Link>
      </Box>
      <Box px={1}>
        <Link
          color="primary"
          href="https://medium.com/psyoptions"
          target="_blank"
          rel="noopener"
        >
          <SvgIcon viewBox="0 -2 24 27" fontSize="small">
            <path d="m22.085 4.733 1.915-1.832v-.401h-6.634l-4.728 11.768-5.379-11.768h-6.956v.401l2.237 2.693c.218.199.332.49.303.783v10.583c.069.381-.055.773-.323 1.05l-2.52 3.054v.396h7.145v-.401l-2.52-3.049c-.273-.278-.402-.663-.347-1.05v-9.154l6.272 13.659h.729l5.393-13.659v10.881c0 .287 0 .346-.188.534l-1.94 1.877v.402h9.412v-.401l-1.87-1.831c-.164-.124-.249-.332-.214-.534v-13.467c-.035-.203.049-.411.213-.534z" />
          </SvgIcon>
        </Link>
      </Box>
    </Box>
  </Box>
);

export default Footer;
