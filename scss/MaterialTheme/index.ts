import shadow from './shadow';
import typography from './typography';

/**
 * GYMORA DARK THEME
 */
export const light = {
	palette: {
		type: 'dark',
		background: {
			default: '#131314',
			paper: '#1c1b1c',
		},
		primary: {
			contrastText: '#003739',
			main: '#00dce5',
		},
		secondary: {
			main: '#ff8a00',
		},
		text: {
			primary: '#e5e2e3',
			secondary: '#b9caca',
			dark: '#ffffff',
		},
	},
	components: {
		MuiTypography: {
			styleOverrides: {
				root: {
					letterSpacing: '0',
					color: '#e5e2e3',
				},
			},
			defaultProps: {
				variantMapping: {
					h1: 'h1',
					h2: 'h2',
					h3: 'h3',
					h4: 'h4',
					h5: 'h5',
					h6: 'h6',
					subtitle1: 'p',
					subtitle2: 'p',
					subtitle3: 'p',
					body1: 'p',
					body2: 'p',
				},
			},
		},
		MuiLink: {
			styleOverrides: {
				root: {
					color: '#b9caca',
					textDecoration: 'none',
				},
			},
		},
		MuiDivider: {
			styleOverrides: {
				root: {
					borderColor: '#3a494a',
				},
			},
		},
		MuiBox: {
			styleOverrides: {
				root: {
					padding: '0',
				},
			},
		},
		MuiContainer: {
			styleOverrides: {
				root: {
					maxWidth: 'inherit',
					padding: '0',
					'@media (min-width: 600px)': {
						paddingLeft: 0,
						paddingRight: 0,
					},
				},
			},
		},
		MuiCssBaseline: {
			styleOverrides: {
				html: { height: '100%' },
				body: { background: '#131314', height: '100%', minHeight: '100%', color: '#e5e2e3' },
				p: {
					margin: '0',
				},
			},
		},
		MuiAvatar: {
			styleOverrides: {
				root: {
					marginLeft: '0',
				},
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					color: '#e5e2e3',
					minWidth: 'auto',
					lineHeight: '1.2',
					boxShadow: 'none',
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					color: '#b9caca',
				},
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: {
					padding: '0',
				},
			},
		},
		MuiList: {
			styleOverrides: {
				root: {
					padding: '0',
				},
			},
		},
		MuiListItem: {
			styleOverrides: {
				root: {
					padding: '0',
				},
			},
		},
		MuiFormControl: {
			styleOverrides: {
				root: {
					width: '100%',
				},
			},
		},
		MuiFormControlLabel: {
			styleOverrides: {
				root: {
					marginRight: '0',
				},
			},
		},
		MuiSelect: {
			styleOverrides: {
				root: {},
				select: {
					textAlign: 'left',
				},
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					height: '48px',
					width: '100%',
					backgroundColor: '#201f20',
					color: '#e5e2e3',
				},
				notchedOutline: {
					padding: '8px',
					top: '-9px',
					border: '1px solid #3a494a',
				},
			},
		},
		MuiFormHelperText: {
			styleOverrides: {
				root: {
					margin: '5px 0 0 2px',
					lineHeight: '1.2',
				},
			},
		},
		MuiTabPanel: {
			styleOverrides: {
				root: {
					padding: '0',
				},
			},
		},
		MuiCheckbox: {
			styleOverrides: {
				root: {
					color: '#849495',
					'&.Mui-checked': {
						color: '#00dce5',
					},
				},
			},
		},
		MuiFab: {
			styleOverrides: {
				root: {
					width: '40px',
					height: '40px',
					background: '#201f20',
					color: '#e5e2e3',
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundColor: '#1c1b1c',
					color: '#e5e2e3',
				},
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					padding: '6px 8px',
					color: '#e5e2e3',
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				root: {
					boxShadow: 'none',
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					border: '1px solid #3a494a',
					color: '#e5e2e3',
				},
			},
		},
		MuiPaginationItem: {
			styleOverrides: {
				root: {
					color: '#b9caca',
					borderColor: '#3a494a',
					'&.Mui-selected': {
						backgroundColor: '#e9feff',
						color: '#003739',
					},
				},
			},
		},
	},
	shadow,
	typography,
};
