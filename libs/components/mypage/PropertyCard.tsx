import { Menu, MenuItem, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import IconButton from '@mui/material/IconButton';
import ModeIcon from '@mui/icons-material/Mode';
import DeleteIcon from '@mui/icons-material/Delete';
import { Workout } from '../../types/workout/workout';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { REACT_APP_API_URL } from '../../config';

interface PropertyCardProps {
	property: Workout;
	deletePropertyHandler?: any;
	memberPage?: boolean;
	updatePropertyHandler?: any;
}

export const PropertyCard = (props: PropertyCardProps) => {
	const { property, deletePropertyHandler, memberPage, updatePropertyHandler } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	/** HANDLERS **/
	const pushEditProperty = async (id: string) => {
		await router.push({
			pathname: '/mypage',
			query: { category: 'addProperty', propertyId: id },
		});
	};

	const pushPropertyDetail = async (id: string) => {
		if (memberPage)
			await router.push({
				pathname: '/workout/detail',
				query: { id: id },
			});
		else return;
	};

	const handleClick = (event: any) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	if (device === 'mobile') {
		return <div>MOBILE WORKOUT CARD</div>;
	} else
		return (
			<Stack className="property-card-box">
				<Stack className="image-box" onClick={() => pushPropertyDetail(property?._id)}>
					<img src={`${REACT_APP_API_URL}/${property.workoutThumbnail}`} alt="" />
				</Stack>
				<Stack className="information-box" onClick={() => pushPropertyDetail(property?._id)}>
					<Typography className="name">{property.workoutTitle}</Typography>
					<Typography className="address">{property.targetMuscle}</Typography>
					<Typography className="price">
						<strong>{property?.isFree ? 'Free' : 'Paid'} - {property.workoutDifficulty}</strong>
					</Typography>
				</Stack>
				<Stack className="date-box">
					<Typography className="date">
						<Moment format="DD MMMM, YYYY">{property.createdAt}</Moment>
					</Typography>
				</Stack>
				<Stack className="status-box">
					<Stack className="coloured-box" sx={{ background: '#E5F0FD' }} onClick={handleClick}>
						<Typography className="status" sx={{ color: '#3554d1' }}>
							{property.workoutDifficulty}
						</Typography>
					</Stack>
				</Stack>

				<Stack className="views-box">
					<Typography className="views">{(property.workoutViews ?? 0).toLocaleString()}</Typography>
				</Stack>
				{!memberPage && (
					<Stack className="action-box">
						<IconButton className="icon-button" onClick={() => pushEditProperty(property._id)}>
							<ModeIcon className="buttons" />
						</IconButton>
						{deletePropertyHandler && (
							<IconButton className="icon-button" onClick={() => deletePropertyHandler(property._id)}>
								<DeleteIcon className="buttons" />
							</IconButton>
						)}
					</Stack>
				)}
			</Stack>
		);
};
