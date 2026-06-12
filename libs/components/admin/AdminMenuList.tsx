import React, { useEffect, useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import Link from 'next/link';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { ChatsCircle, User, UserCircleGear } from 'phosphor-react';
import cookies from 'js-cookie';
import useDeviceDetect from '../../hooks/useDeviceDetect';

const AdminMenuList = (props: any) => {
	const router = useRouter();
	const device = useDeviceDetect();
	const [mobileLayout, setMobileLayout] = useState(false);
	const [openSubMenu, setOpenSubMenu] = useState('Users');
	const [openMenu, setOpenMenu] = useState(typeof window === 'object' ? cookies.get('admin_menu') === 'true' : false);
	const [clickMenu, setClickMenu] = useState<any>([]);
	const [clickSubMenu, setClickSubMenu] = useState('');

	const {
		router: { pathname },
	} = props;

	const pathnames = pathname.split('/').filter((x: any) => x);

	/** LIFECYCLES **/
	useEffect(() => {
		if (device === 'mobile') setMobileLayout(true);

		switch (pathnames[1]) {
			case 'workouts':
				setClickMenu(['Workouts']);
				break;
			case 'courses':
				setClickMenu(['Programs']);
				break;
			case 'trainers':
				setClickMenu(['Trainers']);
				break;
			case 'community':
				setClickMenu(['Community']);
				break;
			default:
				setClickMenu(['Users']);
				break;
		}

		switch (pathnames[2]) {
			case 'logs':
				setClickSubMenu('Logs');
				break;
			case 'inquiry':
				setClickSubMenu('1:1 Inquiry');
				break;
			case 'notice':
				setClickSubMenu('Notice');
				break;
			case 'faq':
				setClickSubMenu('FAQ');
				break;
			case 'board_create':
				setClickSubMenu('Board Create');
				break;
			default:
				setClickSubMenu('List');
				break;
		}
	}, []);

	/** HANDLERS **/
	const subMenuChangeHandler = (target: string) => {
		if (clickMenu.find((item: string) => item === target)) {
			// setOpenSubMenu('');
			setClickMenu(clickMenu.filter((menu: string) => target !== menu));
		} else {
			// setOpenSubMenu(target);
			setClickMenu([...clickMenu, target]);
		}
	};

	const menu_set = [
		{
			title: 'Users',
			icon: <User size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('Users'),
		},
		{
			title: 'Workouts',
			icon: <UserCircleGear size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('Workouts'),
		},
		{
			title: 'Programs',
			icon: <UserCircleGear size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('Programs'),
		},
		{
			title: 'Trainers',
			icon: <UserCircleGear size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('Trainers'),
		},
		{
			title: 'Community',
			icon: <ChatsCircle size={20} color="#bdbdbd" weight="fill" />,
			on_click: () => subMenuChangeHandler('Community'),
		},
	];

	const sub_menu_set: any = {
		Users: [{ title: 'List', url: '/_admin/users' }],
		Workouts: [{ title: 'List', url: '/_admin/workouts' }],
		Programs: [{ title: 'List', url: '/_admin/courses' }],
		Trainers: [{ title: 'List', url: '/_admin/trainers' }],
		Community: [{ title: 'List', url: '/_admin/community' }],
	};

	// The legacy admin.scss that used to style this menu was removed — all
	// styling lives here now, matching the dark #101012 drawer.
	const isMenuActive = (title: string) => clickMenu.includes(title);
	const isRouteActive = (title: string) => {
		const target = sub_menu_set[title]?.[0]?.url;
		return target ? pathname.startsWith(target) : false;
	};

	return (
		<>
			{menu_set.map((item, index) => {
				const open = isMenuActive(item.title);
				const routeOn = isRouteActive(item.title);
				return (
					<List key={index} disablePadding sx={{ mb: '2px' }}>
						<ListItemButton
							onClick={item.on_click}
							component={'li'}
							sx={{
								minHeight: 46,
								borderRadius: '10px',
								mx: 1.25,
								px: 1.75,
								background: routeOn && !open ? 'rgba(0,220,229,0.06)' : 'transparent',
								'&:hover': { background: 'rgba(255,255,255,0.05)' },
							}}
						>
							<ListItemIcon sx={{ minWidth: 0, mr: 1.75, justifyContent: 'center', opacity: routeOn ? 1 : 0.75 }}>
								{item.icon}
							</ListItemIcon>
							<ListItemText
								primaryTypographyProps={{
									fontFamily: 'Hanken Grotesk',
									fontSize: '14.5px',
									fontWeight: 700,
									color: routeOn ? '#e9feff' : 'rgba(213,226,226,0.8)',
								}}
							>
								{item.title}
							</ListItemText>
							{open ? (
								<ExpandLess sx={{ fontSize: 18, color: 'rgba(185,202,202,0.55)' }} />
							) : (
								<ExpandMore sx={{ fontSize: 18, color: 'rgba(185,202,202,0.55)' }} />
							)}
						</ListItemButton>
						<Collapse in={open} timeout="auto" component="li" unmountOnExit>
							<List disablePadding sx={{ py: 0.5 }}>
								{sub_menu_set[item.title] &&
									sub_menu_set[item.title].map((sub: any, i: number) => {
										const subOn = routeOn && clickSubMenu === sub.title;
										return (
											<Link href={sub.url} shallow={true} replace={true} key={i} style={{ textDecoration: 'none' }}>
												<ListItemButton
													component="li"
													sx={{
														minHeight: 38,
														borderRadius: '9px',
														mx: 1.25,
														ml: 5.5,
														px: 1.5,
														position: 'relative',
														background: subOn ? 'rgba(0,220,229,0.1)' : 'transparent',
														'&:hover': { background: subOn ? 'rgba(0,220,229,0.13)' : 'rgba(255,255,255,0.05)' },
														'&::before': {
															content: '""',
															position: 'absolute',
															left: '-14px',
															top: '50%',
															transform: 'translateY(-50%)',
															width: '5px',
															height: '5px',
															borderRadius: '50%',
															background: subOn ? '#00dce5' : 'rgba(255,255,255,0.18)',
															boxShadow: subOn ? '0 0 8px rgba(0,220,229,0.6)' : 'none',
														},
													}}
												>
													<Typography
														component={'span'}
														sx={{
															fontFamily: 'Hanken Grotesk',
															fontSize: '13.5px',
															fontWeight: 600,
															color: subOn ? '#00dce5' : 'rgba(185,202,202,0.75)',
														}}
													>
														{sub.title}
													</Typography>
												</ListItemButton>
											</Link>
										);
									})}
							</List>
						</Collapse>
					</List>
				);
			})}
		</>
	);
};

export default withRouter(AdminMenuList);
