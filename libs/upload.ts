import axios from 'axios';
import { getJwtToken } from './auth';

const post = async (operations: object, file: File, resultKey: string): Promise<string> => {
	const token = getJwtToken();
	const formData = new FormData();
	formData.append('operations', JSON.stringify(operations));
	formData.append('map', JSON.stringify({ '0': ['variables.file'] }));
	formData.append('0', file);

	const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
			'apollo-require-preflight': true,
			Authorization: `Bearer ${token}`,
		},
	});

	const result = response.data?.data?.[resultKey];
	if (!result) throw new Error(response.data?.errors?.[0]?.message || 'Upload failed');
	return result as string;
};

/** imageUploader(file, target) — target: member/workout/course/article/... */
export const uploadImageFile = (file: File, target: string) =>
	post(
		{
			query: `mutation ImageUploader($file: Upload!, $target: String!) { imageUploader(file: $file, target: $target) }`,
			variables: { file: null, target },
		},
		file,
		'imageUploader',
	);

/** videoUploader(file) — mp4/webm/ogg, stored under uploads/video */
export const uploadVideoFile = (file: File) =>
	post(
		{
			query: `mutation VideoUploader($file: Upload!) { videoUploader(file: $file) }`,
			variables: { file: null },
		},
		file,
		'videoUploader',
	);
