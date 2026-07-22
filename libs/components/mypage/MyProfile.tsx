import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import axios from 'axios';
import { Messages, REACT_APP_API_URL } from '../../config';
import { getJwtToken, updateStorage, updateUserInfo } from '../../auth';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { GET_MY_MEMBER } from '../../../apollo/user/query';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';

const labelStyle: React.CSSProperties = {
	fontFamily: 'JetBrains Mono, monospace',
	fontSize: '10px',
	letterSpacing: '0.08em',
	color: '#9aabab',
	textTransform: 'uppercase',
	display: 'block',
	marginBottom: '7px',
};

const MyProfile: NextPage = ({ initialValues, ...props }: any) => {
	const device = useDeviceDetect();
	const { t } = useTranslation('mypage');
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);
	const [uploading, setUploading] = useState(false);
	const [saving, setSaving] = useState(false);

	/** APOLLO REQUESTS **/
	const [updateMember] = useMutation(UPDATE_MEMBER);
	const { data: profileData, refetch: profileRefetch } = useQuery(GET_MY_MEMBER, {
		fetchPolicy: 'network-only',
		skip: !user?._id,
	});
	const profile = profileData?.getMyMember ?? user;

	/** LIFECYCLES **/
	useEffect(() => {
		setUpdateData((previous) => ({
			...previous,
			memberNick: profile.memberNick,
			memberPhone: profile.memberPhone,
			memberAddress: profile.memberAddress,
			memberImage: profile.memberImage,
			memberDesc: profile.memberDesc,
		}));
	}, [profile._id, profile.memberNick, profile.memberPhone, profile.memberAddress, profile.memberImage, profile.memberDesc]);

	/** HANDLERS **/
	const uploadImage = async (e: any) => {
		try {
			const image = e.target.files[0];
			if (!image) return;
			setUploading(true);
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
		} catch (err: any) {
			sweetMixinErrorAlert(t('alerts.imageUploadFailed')).then();
		} finally {
			setUploading(false);
		}
	};

	const updateProfileHandler = useCallback(async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			setSaving(true);
			const result = await updateMember({
				variables: { input: { ...updateData, _id: user._id } },
			});
			const jwtToken = result.data.updateMember?.accessToken;
			await updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			await profileRefetch();
			await sweetMixinSuccessAlert(t('alerts.profileUpdated'));
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setSaving(false);
		}
	}, [profileRefetch, t, updateData, user?._id]);

	const isDisabled = saving || !updateData.memberNick || !updateData.memberPhone;

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			<div className="nt-head">
				<div>
					<span className="lp-eyebrow" style={{ marginBottom: '6px' }}>
						{t('profile.eyebrow')}
					</span>
					<h2>{t('profile.title')}</h2>
				</div>
			</div>

			{/* Photo */}
			<div className="wd-form-card" style={{ marginBottom: '18px' }}>
				<span style={labelStyle}>{t('profile.photo')}</span>
				<div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginTop: '12px' }}>
					<div
						style={{
							width: '88px',
							height: '88px',
							borderRadius: '50%',
							overflow: 'hidden',
							border: '2.5px solid rgba(0,220,229,0.4)',
							boxShadow: '0 0 24px rgba(0,220,229,0.15)',
							flexShrink: 0,
							opacity: uploading ? 0.5 : 1,
							transition: 'opacity 0.3s ease',
						}}
					>
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
							className="nt-markall"
							style={{ display: 'inline-block', cursor: uploading ? 'wait' : 'pointer' }}
						>
							{uploading ? t('profile.uploading') : t('profile.uploadImage')}
						</label>
						<p style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: 'rgba(185,202,202,0.45)', marginTop: '9px' }}>
							{t('profile.photoFormats')}
						</p>
					</div>
				</div>
			</div>

			{/* Fields */}
			<div className="wd-form-card">
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
					<div>
						<span style={labelStyle}>{t('profile.username')}</span>
						<input
							className="wd-input"
							type="text"
							placeholder={t('profile.usernamePlaceholder')}
							value={updateData.memberNick || ''}
							onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
						/>
					</div>
					<div>
						<span style={labelStyle}>{t('profile.phone')}</span>
						<input
							className="wd-input"
							type="text"
							placeholder={t('profile.phonePlaceholder')}
							value={updateData.memberPhone || ''}
							onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberPhone: value })}
						/>
					</div>
				</div>

				<div style={{ marginBottom: '16px' }}>
					<span style={labelStyle}>{t('profile.address')}</span>
					<input
						className="wd-input"
						type="text"
						placeholder={t('profile.addressPlaceholder')}
						value={updateData.memberAddress || ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberAddress: value })}
					/>
				</div>

				<div style={{ marginBottom: '22px' }}>
					<span style={labelStyle}>{t('profile.description')}</span>
					<textarea
						className="wd-textarea"
						placeholder={t('profile.descPlaceholder')}
						value={updateData.memberDesc || ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberDesc: value })}
					/>
				</div>

				<button className="wd-btn" onClick={updateProfileHandler} disabled={isDisabled}>
					{saving ? t('profile.saving') : t('profile.update')}
				</button>
			</div>
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
