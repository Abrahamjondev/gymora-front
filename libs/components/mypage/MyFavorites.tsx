import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack, Typography } from '@mui/material';
import PropertyCard from '../property/PropertyCard';
import { Workout } from '../../types/workout/workout';
import { T } from '../../types/common';
import { useMutation, useQuery } from '@apollo/client';
import { LIKE_WORKOUT } from '../../../apollo/user/mutation';
import { GET_WORKOUTS } from '../../../apollo/user/query';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

const MyFavorites: NextPage = () => {
	const device = useDeviceDetect();
	const [myFavorites, setMyFavorites] = useState<Workout[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFavorites, setSearchFavorites] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const [likeWorkout] = useMutation(LIKE_WORKOUT);

	const {
		loading: getFavoritesLoading,
		data: getFavoritesData,
		error: getFavoritesError,
		refetch: getFavoritesRefetch,
	} = useQuery(GET_WORKOUTS, {
		fetchPolicy: 'network-only',

		variables: {
			input: searchFavorites,
		},

		notifyOnNetworkStatusChange: true,

		onCompleted(data: T) {
			setMyFavorites(data?.getWorkouts?.list);

			setTotal(data?.getWorkouts?.metaCounter?.[0]?.total || 0);
		},
	});
	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFavorites({ ...searchFavorites, page: value });
	};
	const likePropertyHandler = async (user: any, id: string) => {
		try {
			if (!id) return;

			if (!user?._id) throw new Error(Messages.error2);

			await likeWorkout({
				variables: {
					input: id,
				},
			});

			await getFavoritesRefetch({
				input: searchFavorites,
			});
		} catch (err: any) {

			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (device === 'mobile') {
		return <div>GYMORA MY FAVORITES MOBILE</div>;
	} else {
		return (
			<div id="my-favorites-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">My Favorites</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					{myFavorites?.length ? (
						myFavorites?.map((property: Workout) => {
							return <PropertyCard property={property} likePropertyHandler={likePropertyHandler} myFavorites={true} />;
						})
					) : (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No Favorites found!</p>
						</div>
					)}
				</Stack>
				{myFavorites?.length ? (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<Pagination
								count={Math.ceil(total / searchFavorites.limit)}
								page={searchFavorites.page}
								shape="circular"
								color="primary"
								onChange={paginationHandler}
							/>
						</Stack>
						<Stack className="total-result">
							<Typography>
								Total {total} favorite propert{total > 1 ? 'ies' : 'y'}
							</Typography>
						</Stack>
					</Stack>
				) : null}
			</div>
		);
	}
};

export default MyFavorites;
