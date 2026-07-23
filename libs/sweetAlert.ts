import Swal from 'sweetalert2';
import 'animate.css';
import { i18n } from 'next-i18next';
import { Messages } from './config';

const collectErrorMessages = (value: unknown, output: string[] = []): string[] => {
	if (!value) return output;
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed) output.push(trimmed);
		return output;
	}
	if (Array.isArray(value)) {
		value.forEach((item) => collectErrorMessages(item, output));
		return output;
	}
	if (typeof value === 'object') {
		const candidate = value as Record<string, unknown>;
		if (candidate.message) collectErrorMessages(candidate.message, output);
		if (candidate.response) collectErrorMessages(candidate.response, output);
		if (candidate.result) collectErrorMessages(candidate.result, output);
		if (candidate.extensions) collectErrorMessages(candidate.extensions, output);
	}
	return output;
};

/**
 * Converts Apollo/Nest/HTTP errors into one useful message for every alert path.
 * Nest validation errors can be nested under extensions.exception.response.message
 * and can also arrive as an array, so callers must not read only error.message.
 */
export const getErrorMessage = (error: unknown, fallback?: string): string => {
	const source = (error && typeof error === 'object' ? error : {}) as Record<string, any>;
	const candidates = [
		source.graphQLErrors,
		source.networkError?.result?.errors,
		source.networkError?.message,
		source.message,
		error,
	];
	const messages = Array.from(new Set(candidates.flatMap((value) => collectErrorMessages(value)))).map((message) =>
		message.replace(/^Definer:\s*/i, '').trim(),
	);
	const meaningful = messages.filter((message) => message && !/^bad request(?: exception)?$/i.test(message));
	const combined = meaningful.join('\n');

	if (combined) return combined;
	if (messages.some((message) => /network|failed to fetch|load failed/i.test(message))) {
		return i18n?.t('common:alerts.networkError', { defaultValue: 'We could not reach Gymora. Check your connection and try again.' }) ?? 'We could not reach Gymora. Check your connection and try again.';
	}
	if (messages.some((message) => /bad request|internal server error|unexpected error/i.test(message))) {
		return i18n?.t('common:alerts.invalidInput', { defaultValue: 'Please check your input and try again.' }) ?? 'Please check your input and try again.';
	}
	return fallback ?? i18n?.t('common:alerts.somethingWrong', { defaultValue: 'Something went wrong!' }) ?? 'Something went wrong!';
};

// Localized button labels for non-React Swal calls (common ns is always loaded)
const btn = (key: string, fallback: string) => i18n?.t(`common:${key}`, { defaultValue: fallback }) ?? fallback;

export const sweetErrorHandling = async (err: any) => {
	await Swal.fire({
		icon: 'error',
		text: getErrorMessage(err),
		showConfirmButton: false,
	});
};

export const sweetTopSuccessAlert = async (msg: string, duration: number = 2000) => {
	await Swal.fire({
		position: 'center',
		icon: 'success',
		title: msg.replace('Definer: ', ''),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetContactAlert = async (msg: string, duration: number = 10000) => {
	await Swal.fire({
		title: msg,
		showConfirmButton: false,
		timer: duration,
	}).then();
};

export const sweetConfirmAlert = (msg: string) => {
	return new Promise(async (resolve, reject) => {
		await Swal.fire({
			icon: 'question',
			text: msg,
			showCancelButton: true,
			showConfirmButton: true,
			confirmButtonText: btn('actions.yes', 'Yes'),
			cancelButtonText: btn('actions.cancel', 'Cancel'),
			// destructive/decisive confirms get the red danger button (themed in app.scss)
			customClass: { confirmButton: 'swal-danger' },
		}).then((response) => {
			if (response?.isConfirmed) resolve(true);
			else resolve(false);
		});
	});
};

export const sweetLoginConfirmAlert = (msg: string) => {
	return new Promise(async (resolve, reject) => {
		await Swal.fire({
			text: msg,
			showCancelButton: true,
			showConfirmButton: true,
			confirmButtonText: btn('nav.login', 'Login'),
		}).then((response) => {
			if (response?.isConfirmed) resolve(true);
			else resolve(false);
		});
	});
};

export const sweetErrorAlert = async (msg: unknown, duration: number = 3000) => {
	await Swal.fire({
		icon: 'error',
		title: getErrorMessage(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetMixinErrorAlert = async (msg: unknown, duration: number = 3000) => {
	await Swal.fire({
		icon: 'error',
		title: getErrorMessage(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetMixinSuccessAlert = async (msg: string, duration: number = 2000) => {
	await Swal.fire({
		icon: 'success',
		title: msg,
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetBasicAlert = async (text: string) => {
	Swal.fire(text);
};

export const sweetErrorHandlingForAdmin = async (err: any) => {
	const errorMessage = getErrorMessage(err, Messages.error1);
	await Swal.fire({
		icon: 'error',
		text: errorMessage,
		showConfirmButton: false,
	});
};

export const sweetTopSmallSuccessAlert = async (
	msg: string,
	duration: number = 2000,
	enable_forward: boolean = false,
) => {
	const Toast = Swal.mixin({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer: duration,
		timerProgressBar: true,
	});

	Toast.fire({
		icon: 'success',
		title: msg,
	}).then((data) => {
		if (enable_forward) {
			window.location.reload();
		}
	});
};
