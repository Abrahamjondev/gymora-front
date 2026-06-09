import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { WorkoutDifficulty } from '../../enums/workout.enum';
import { REACT_APP_API_URL } from '../../config';
import { WorkoutInput } from '../../types/workout/workout.input';
import axios from 'axios';
import { getJwtToken } from '../../auth';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_WORKOUT } from '../../../apollo/user/query';
import { CREATE_WORKOUT, UPDATE_WORKOUT } from '../../../apollo/user/mutation';

const AddProperty = ({ initialValues, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const inputRef = useRef<any>(null);
	const [insertWorkoutData, setInsertWorkoutData] = useState<WorkoutInput>(initialValues);
	const [workoutDifficulties] = useState<WorkoutDifficulty[]>(Object.values(WorkoutDifficulty));
	const token = getJwtToken();
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const [createWorkout] = useMutation(CREATE_WORKOUT);
	const [updateWorkout] = useMutation(UPDATE_WORKOUT);

	const {
		loading: getWorkoutLoading,
		data: getWorkoutData,
		error: getWorkoutError,
		refetch: getWorkoutRefetch,
	} = useQuery(GET_WORKOUT, {
		fetchPolicy: 'network-only',
		variables: {
			input: router.query.propertyId,
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		setInsertWorkoutData({
			...insertWorkoutData,
			workoutTitle: getWorkoutData?.getWorkout ? getWorkoutData?.getWorkout?.workoutTitle : '',
			workoutDesc: getWorkoutData?.getWorkout ? getWorkoutData?.getWorkout?.workoutDesc : '',
			workoutDifficulty: getWorkoutData?.getWorkout
				? getWorkoutData?.getWorkout?.workoutDifficulty
				: WorkoutDifficulty.BEGINNER,
			targetMuscle: getWorkoutData?.getWorkout ? getWorkoutData?.getWorkout?.targetMuscle : '',
			estimatedCaloriesBurned: getWorkoutData?.getWorkout
				? getWorkoutData?.getWorkout?.estimatedCaloriesBurned
				: 0,
			isFree: getWorkoutData?.getWorkout ? getWorkoutData?.getWorkout?.isFree : true,
			workoutThumbnail: getWorkoutData?.getWorkout ? getWorkoutData?.getWorkout?.workoutThumbnail : '',
			videoUrl: getWorkoutData?.getWorkout ? getWorkoutData?.getWorkout?.videoUrl : '',
		});
	}, [getWorkoutLoading, getWorkoutData]);

	/** HANDLERS **/
	async function uploadImages() {
		try {
			const formData = new FormData();
			const selectedFiles = inputRef.current.files;

			if (selectedFiles.length == 0) return false;
			if (selectedFiles.length > 1) throw new Error('Cannot upload more than 1 image!');

			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target)
				  }`,
					variables: {
						file: null,
						target: 'workout',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', selectedFiles[0]);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;

			console.log('+responseImage: ', responseImage);
			setInsertWorkoutData({ ...insertWorkoutData, workoutThumbnail: responseImage });
		} catch (err: any) {
			console.log('err: ', err.message);
			await sweetMixinErrorAlert(err.message);
		}
	}

	const doDisabledCheck = () => {
		if (
			insertWorkoutData.workoutTitle === '' ||
			insertWorkoutData.targetMuscle === '' ||
			!insertWorkoutData.workoutDifficulty
		) {
			return true;
		}
	};

	const insertWorkoutHandler = useCallback(async () => {
		try {
			await createWorkout({
				variables: {
					input: insertWorkoutData,
				},
			});

			await sweetMixinSuccessAlert('This workout has been created successfully.');

			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myProperties',
				},
			});
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertWorkoutData]);

	const updateWorkoutHandler = useCallback(async () => {
		try {
			const updateData: any = { ...insertWorkoutData };
			updateData._id = getWorkoutData?.getWorkout?._id;

			await updateWorkout({
				variables: {
					input: updateData,
				},
			});

			await sweetMixinSuccessAlert('This workout has been updated successfully.');

			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myProperties',
				},
			});
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertWorkoutData]);

	if (user?.memberType !== 'TRAINER') {
		router.back();
	}

	console.log('+insertWorkoutData', insertWorkoutData);

	if (device === 'mobile') {
		return <div>ADD NEW WORKOUT MOBILE PAGE</div>;
	} else {
		return (
			<div id="add-property-page">
				<Stack className="main-title-box">
					<Typography className="main-title">Add New Workout</Typography>
					<Typography className="sub-title">We are glad to see you again!</Typography>
				</Stack>

				<div>
					<Stack className="config">
						<Stack className="description-box">
							<Stack className="config-column">
								<Typography className="title">Title</Typography>
								<input
									type="text"
									className="description-input"
									placeholder={'Workout Title'}
									value={insertWorkoutData.workoutTitle}
									onChange={({ target: { value } }) =>
										setInsertWorkoutData({ ...insertWorkoutData, workoutTitle: value })
									}
								/>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Difficulty</Typography>
									<select
										className={'select-description'}
										value={insertWorkoutData.workoutDifficulty || 'select'}
										onChange={({ target: { value } }) =>
											setInsertWorkoutData({
												...insertWorkoutData,
												workoutDifficulty: value as WorkoutDifficulty,
											})
										}
									>
										<option selected={true} disabled={true} value={'select'}>
											Select
										</option>
										{workoutDifficulties.map((diff: any) => (
											<option value={`${diff}`} key={diff}>
												{diff}
											</option>
										))}
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Target Muscle</Typography>
									<input
										type="text"
										className="description-input"
										placeholder={'e.g. Chest, Back, Legs'}
										value={insertWorkoutData.targetMuscle}
										onChange={({ target: { value } }) =>
											setInsertWorkoutData({ ...insertWorkoutData, targetMuscle: value })
										}
									/>
								</Stack>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Estimated Calories Burned</Typography>
									<input
										type="number"
										className="description-input"
										placeholder={'Calories'}
										value={insertWorkoutData.estimatedCaloriesBurned ?? 0}
										onChange={({ target: { value } }) =>
											setInsertWorkoutData({
												...insertWorkoutData,
												estimatedCaloriesBurned: parseInt(value),
											})
										}
									/>
								</Stack>
								<Stack className="price-year-after-price">
									<Typography className="title">Free Workout</Typography>
									<select
										className={'select-description'}
										value={insertWorkoutData.isFree ? 'yes' : 'no'}
										onChange={({ target: { value } }) =>
											setInsertWorkoutData({ ...insertWorkoutData, isFree: value === 'yes' })
										}
									>
										<option value={'yes'}>Yes</option>
										<option value={'no'}>No</option>
									</select>
									<div className={'divider'}></div>
									<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
								</Stack>
							</Stack>

							<Stack className="config-row">
								<Stack className="price-year-after-price">
									<Typography className="title">Video URL</Typography>
									<input
										type="text"
										className="description-input"
										placeholder={'Video URL (optional)'}
										value={insertWorkoutData.videoUrl ?? ''}
										onChange={({ target: { value } }) =>
											setInsertWorkoutData({ ...insertWorkoutData, videoUrl: value })
										}
									/>
								</Stack>
							</Stack>

							<Typography className="property-title">Workout Description</Typography>
							<Stack className="config-column">
								<Typography className="title">Description</Typography>
								<textarea
									name=""
									id=""
									className="description-text"
									value={insertWorkoutData.workoutDesc ?? ''}
									onChange={({ target: { value } }) =>
										setInsertWorkoutData({ ...insertWorkoutData, workoutDesc: value })
									}
								></textarea>
							</Stack>
						</Stack>

						<Typography className="upload-title">Upload thumbnail for your workout</Typography>
						<Stack className="images-box">
							<Stack className="upload-box">
								<Stack className="text-box">
									<Typography className="drag-title">Drag and drop image here</Typography>
									<Typography className="format-title">Photo must be JPEG or PNG format</Typography>
								</Stack>
								<Button
									className="browse-button"
									onClick={() => {
										inputRef.current.click();
									}}
								>
									<Typography className="browse-button-text">Browse Files</Typography>
									<input
										ref={inputRef}
										type="file"
										hidden={true}
										onChange={uploadImages}
										accept="image/jpg, image/jpeg, image/png"
									/>
								</Button>
							</Stack>
							<Stack className="gallery-box">
								{insertWorkoutData?.workoutThumbnail && (
									<Stack className="image-box">
										<img src={`${REACT_APP_API_URL}/${insertWorkoutData.workoutThumbnail}`} alt="" />
									</Stack>
								)}
							</Stack>
						</Stack>

						<Stack className="buttons-row">
							{router.query.propertyId ? (
								<Button className="next-button" disabled={doDisabledCheck()} onClick={updateWorkoutHandler}>
									<Typography className="next-button-text">Save</Typography>
								</Button>
							) : (
								<Button className="next-button" disabled={doDisabledCheck()} onClick={insertWorkoutHandler}>
									<Typography className="next-button-text">Save</Typography>
								</Button>
							)}
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

AddProperty.defaultProps = {
	initialValues: {
		workoutTitle: '',
		workoutDesc: '',
		workoutDifficulty: WorkoutDifficulty.BEGINNER,
		targetMuscle: '',
		estimatedCaloriesBurned: 0,
		isFree: true,
		workoutThumbnail: '',
		videoUrl: '',
	},
};

export default AddProperty;
