import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import axios from 'axios';
import { Messages, REACT_APP_API_URL } from '../../config';
import { getJwtToken, updateStorage, updateUserInfo } from '../../auth';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

const inputStyle = {
	width: '100%',
	padding: '14px 16px',
	background: 'rgba(255,255,255,0.03)',
	border: '1px solid #3a494a',
	borderRadius: '8px',
	fontFamily: 'Hanken Grotesk, sans-serif',
	fontSize: '14px',
	color: '#e5e2e3',
	outline: 'none',
};

const labelStyle = {
	fontFamily: 'JetBrains Mono, monospace',
	fontSize: '11px',
	letterSpacing: '0.05em',
	color: '#849495',
	textTransform: 'uppercase' as const,
	display: 'block',
	marginBottom: '8px',
};

const MyProfile: NextPage = ({ initialValues, ...props }: any) => {
	const device = useDeviceDetect();
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);

	/** APOLLO REQUESTS **/
	const [updateMember] = useMutation(UPDATE_MEMBER);

	/** LIFECYCLES **/
	useEffect(() => {
		setUpdateData({
			...updateData,
			memberNick: user.memberNick,
			memberPhone: user.memberPhone,
			memberAddress: user.memberAddress,
			memberImage: user.memberImage,
		});
	}, [user]);

	/** HANDLERS **/
	const uploadImage = async (e: any) => {
		try {
			const image = e.target.files[0];
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target)
				  }`,
					variables: { file: null, target: 'member' },
				}),
			);
			formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			updateData.memberImage = responseImage;
			setUpdateData({ ...updateData });
		} catch (err) {
		}
	};

	const updateProfileHandler = useCallback(async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const result = await updateMember({
				variables: { input: { ...updateData, _id: user._id } },
			});
			const jwtToken = result.data.updateMember?.accessToken;
			await updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			await sweetMixinSuccessAlert('Profile updated successfully.');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [updateData]);

	const isDisabled = !updateData.memberNick || !updateData.memberPhone;

	if (device === 'mobile') {
		return <div style={{ padding: '24px', color: '#e5e2e3' }}>MY PROFILE MOBILE</div>;
	}

	return (
		<div>
			<h2 style={{ fontFamily: 'Hanken Grotesk', fontSize: '28px', fontWeight: 700, color: '#e5e2e3', marginBottom: '8px' }}>
				My Profile
			</h2>
			<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#849495', marginBottom: '32px' }}>
				Update your personal information
			</p>

			{/* Photo */}
			<div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
				<span style={labelStyle}>Profile Photo</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px' }}>
					<div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #3a494a', flexShrink: 0 }}>
						<img
							src={updateData?.memberImage ? `${REACT_APP_API_URL}/${updateData.memberImage}` : '/img/profile/defaultUser.svg'}
							alt=""
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					</div>
					<div>
						<input type="file" hidden id="profile-upload" onChange={uploadImage} accept="image/jpg, image/jpeg, image/png" />
						<label
							htmlFor="profile-upload"
							style={{
								display: 'inline-block',
								padding: '10px 20px',
								background: '#353436',
								border: '1px solid #3a494a',
								borderRadius: '8px',
								fontFamily: 'Hanken Grotesk',
								fontSize: '13px',
								fontWeight: 600,
								color: '#e5e2e3',
								cursor: 'pointer',
							}}
						>
							Upload Image
						</label>
						<p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginTop: '8px' }}>
							JPG, JPEG or PNG format
						</p>
					</div>
				</div>
			</div>

			{/* Fields */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
				<div>
					<span style={labelStyle}>Username</span>
					<input
						type="text"
						placeholder="Your username"
						value={updateData.memberNick || ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
						style={inputStyle}
					/>
				</div>
				<div>
					<span style={labelStyle}>Phone</span>
					<input
						type="text"
						placeholder="Your phone"
						value={updateData.memberPhone || ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberPhone: value })}
						style={inputStyle}
					/>
				</div>
			</div>

			<div style={{ marginBottom: '16px' }}>
				<span style={labelStyle}>Address</span>
				<input
					type="text"
					placeholder="Your address"
					value={updateData.memberAddress || ''}
					onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberAddress: value })}
					style={inputStyle}
				/>
			</div>

			<div style={{ marginBottom: '24px' }}>
				<span style={labelStyle}>Description</span>
				<textarea
					placeholder="About yourself..."
					value={updateData.memberDesc || ''}
					onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberDesc: value })}
					style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
				/>
			</div>

			<button
				onClick={updateProfileHandler}
				disabled={isDisabled}
				style={{
					padding: '14px 32px',
					borderRadius: '8px',
					border: 'none',
					fontFamily: 'Hanken Grotesk',
					fontSize: '14px',
					fontWeight: 700,
					cursor: isDisabled ? 'not-allowed' : 'pointer',
					background: isDisabled ? '#353436' : '#e9feff',
					color: isDisabled ? '#849495' : '#003739',
				}}
			>
				Update Profile
			</button>
		</div>
	);
};

MyProfile.defaultProps = {
	initialValues: {
		_id: '',
		memberImage: '',
		memberNick: '',
		memberPhone: '',
		memberAddress: '',
		memberDesc: '',
	},
};

export default MyProfile;
