// Payload emitted by the official Telegram Login Widget (telegram-widget.js)
// and consumed by the backend `telegramAuth` mutation (TelegramAuthInput).
// The backend HMAC-verifies these exact fields, so they are forwarded as-is.
export interface TelegramAuthInput {
	id: number;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	auth_date: number;
	hash: string;
}
