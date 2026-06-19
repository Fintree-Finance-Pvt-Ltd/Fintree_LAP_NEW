import { createTheme } from '@mui/material/styles';
import { palette } from './palette.js';
import { typography } from './typography.js';

export const theme = createTheme({
  palette,
  typography,
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } }
  }
});
