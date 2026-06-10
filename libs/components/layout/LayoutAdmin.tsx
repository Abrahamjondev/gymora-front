import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MenuList from '../admin/AdminMenuList';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Menu, MenuItem } from '@mui/material';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { MemberType } from '../../enums/member.enum';
const drawerWidth = 280;

const withAdminLayout = (Component: ComponentType) => {
	return (props: object) => {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const [settingsState, setSettingsStateState] = useState(false);
		const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
		const [openMenu, setOpenMenu] = useState(false);
		const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
		const [title, setTitle] = useState('admin');
		const [loading, setLoading] = useState(true);
		const isMobile = useMediaQuery('(max-width:768px)');
		const [drawerOpen, setDrawerOpen] = useState(false);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
			setLoading(false);
		}, []);

		useEffect(() => {
			if (!loading && user.memberType !== MemberType.ADMIN) {
				router.push('/').then();
			}
		}, [loading, user, router]);

		useEffect(() => {
			setDrawerOpen(false);
		}, [router.asPath]);

		/** HANDLERS **/
		const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
			setAnchorElUser(event.currentTarget);
		};

		const handleCloseUserMenu = () => {
			setAnchorElUser(null);
		};

		const logoutHandler = () => {
			logOut();
			router.push('/').then();
		};

		if (!user || user?.memberType !== MemberType.ADMIN) return null;

		return (
			<main id="pc-wrap" className="admin" style={{ background: '#0d0d0e', minHeight: '100vh' }}>
				<Box component={'div'} sx={{ display: 'flex' }}>
					<AppBar
						position="fixed"
						sx={{
							width: isMobile ? '100%' : `calc(100% - ${drawerWidth}px)`,
							ml: isMobile ? 0 : `${drawerWidth}px`,
							boxShadow: 'none',
							background: 'rgba(13,13,14,0.85)',
							backdropFilter: 'blur(16px)',
							borderBottom: '1px solid rgba(255,255,255,0.06)',
						}}
					>
						<Toolbar>
							{isMobile && (
								<IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#e9feff', mr: 'auto' }} aria-label="Open menu">
									<MenuIcon />
								</IconButton>
							)}
							<Tooltip title="Open settings">
								<IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
									<Avatar
										src={
											user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'
										}
									/>
								</IconButton>
							</Tooltip>
							<Menu
								sx={{ mt: '45px' }}
								id="menu-appbar"
								className={'pop-menu'}
								PaperProps={{
									sx: {
										background: '#161618',
										border: '1px solid rgba(255,255,255,0.08)',
										borderRadius: '14px',
										color: '#e5e2e3',
										boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
									},
								}}
								anchorEl={anchorElUser}
								anchorOrigin={{
									vertical: 'top',
									horizontal: 'right',
								}}
								keepMounted
								transformOrigin={{
									vertical: 'top',
									horizontal: 'right',
								}}
								open={Boolean(anchorElUser)}
								onClose={handleCloseUserMenu}
							>
								<Box
									component={'div'}
									onClick={handleCloseUserMenu}
									sx={{
										width: '200px',
									}}
								>
									<Stack sx={{ px: '20px', my: '12px' }}>
										<Typography variant={'h6'} component={'h6'} sx={{ mb: '4px', color: '#ffffff', fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: '15px' }}>
											{user?.memberNick}
										</Typography>
										<Typography variant={'subtitle1'} component={'p'} sx={{ color: 'rgba(185,202,202,0.55)', fontFamily: 'JetBrains Mono', fontSize: '11px' }}>
											{user?.memberPhone}
										</Typography>
									</Stack>
									<Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
									<Box component={'div'} sx={{ p: 1, py: '6px' }} onClick={logoutHandler}>
										<MenuItem sx={{ px: '16px', py: '6px', borderRadius: '8px', '&:hover': { background: 'rgba(255,138,138,0.08)' } }}>
											<Typography variant={'subtitle1'} component={'span'} sx={{ color: '#ffb4a8', fontFamily: 'Hanken Grotesk', fontWeight: 600, fontSize: '13.5px' }}>
												Logout
											</Typography>
										</MenuItem>
									</Box>
								</Box>
							</Menu>
						</Toolbar>
					</AppBar>

					<Drawer
						sx={{
							width: drawerWidth,
							flexShrink: 0,
							'& .MuiDrawer-paper': {
								width: drawerWidth,
								boxSizing: 'border-box',
								background: '#101012',
								borderRight: '1px solid rgba(255,255,255,0.06)',
								color: '#e5e2e3',
							},
						}}
						variant={isMobile ? 'temporary' : 'permanent'}
						open={isMobile ? drawerOpen : true}
						onClose={() => setDrawerOpen(false)}
						ModalProps={{ keepMounted: true }}
						anchor="left"
						className="aside"
					>
						<Toolbar sx={{ flexDirection: 'column', alignItems: 'flexStart' }}>
							<Stack className={'logo-box'} direction={'row'} alignItems={'center'} gap={'10px'} sx={{ py: '14px' }}>
								<div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '9px',
										background: 'linear-gradient(135deg, #00dce5 0%, #00f5ff 100%)',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: '0 0 18px rgba(0,220,229,0.3)',
									}}
								>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 900, color: '#003739' }}>G</span>
								</div>
								<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '19px', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
									gymora <span style={{ fontFamily: 'JetBrains Mono', fontSize: '9px', color: 'rgba(0,220,229,0.7)', letterSpacing: '0.12em', verticalAlign: 'middle' }}>ADMIN</span>
								</span>
							</Stack>

							<Stack
								className="user"
								direction={'row'}
								alignItems={'center'}
								sx={{
									bgcolor: openMenu ? 'rgba(255, 255, 255, 0.04)' : 'none',
									borderRadius: '8px',
									px: '24px',
									py: '11px',
								}}
							>
								<Avatar
									src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
								/>
								<Typography variant={'body2'} p={1} ml={1}>
									{user?.memberNick} <br />
									{user?.memberPhone}
								</Typography>
							</Stack>
						</Toolbar>

						<Divider />

						<MenuList />
					</Drawer>

					<Box component={'div'} id="bunker" sx={{ flexGrow: 1, pt: isMobile ? '64px' : 0, minWidth: 0 }}>
						{/*@ts-ignore*/}
						<Component {...props} setSnackbar={setSnackbar} setTitle={setTitle} />
					</Box>
				</Box>
			</main>
		);
	};
};

export default withAdminLayout;
