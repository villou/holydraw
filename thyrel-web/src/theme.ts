import { responsiveFontSizes, createMuiTheme, fade } from '@material-ui/core';
import createPalette, { Palette } from '@material-ui/core/styles/createPalette';

export const PRIMARY = '#9c27b0';
export const SECONDARY = '#880061';

function createBaseTheme(palette: Palette) {
  return createMuiTheme({
    palette: palette,
    typography: {
      h1: {
        fontSize: 64,
        fontFamily: 'Modak',
      },
      h4: {
        fontFamily: 'Work Sans',
        fontWeight: 'bold',
        fontSize: 32,
      },
      h5: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Work Sans, -apple-system, BlinkMacSystemFont, Segoe UI',
      },
      subtitle1: {
        fontFamily: 'Work Sans',
        fontWeight: 'bold',
        fontSize: 16,
      },
      subtitle2: {
        fontSize: 12,
      },
      body1: {
        fontSize: 16,
      },
      body2: {
        fontSize: 14,
      },
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Open Sans',
        'Helvetica Neue',
        'sans-serif',
      ].join(','),
    },
    spacing: 8,
    overrides: {
      MuiButton: {
        label: {
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        },
        root: {
          textTransform: 'none',
          padding: '4px 8px',
          borderRadius: 6,
        },
        contained: {
          height: 42,
          fontSize: 16,
          color: palette.common.white,
          fontFamily: 'Work Sans',
          backgroundColor: palette.divider,
          boxShadow: `0px 8px 1px ${fade('#000000', 0.8)}`,
          position: 'relative',
          '&:hover': {
            backgroundColor: palette.action.hover,

            boxShadow: `0px 8px 1px ${fade('#000000', 0.8)}`,
          },
          '&:focus': {
            boxShadow: `0px 8px 1px ${fade('#000000', 0.8)}`,
          },
          '&:active': {
            top: 8,
            boxShadow: 'none',
          },
        },
        iconSizeLarge: {
          marginLeft: 0,
        },
        containedSizeLarge: {
          height: 58,
          padding: '8px 16px',
          fontSize: 32,
        },
      },
    },
  });
}

let theme = createBaseTheme(
  createPalette({
    type: 'dark',
    primary: {
      main: PRIMARY,
    },
    secondary: {
      main: SECONDARY,
    },
    background: {
      default: '#0f131a',
      paper: '#1a1d24',
    },
  }),
);

theme = responsiveFontSizes(theme);

export default theme;
