import React, { useEffect, useRef } from 'react';
import { TelegramAuthInput } from '../../types/telegramAuth';

interface TelegramLoginButtonProps {
	/** Fired with the widget payload once Telegram has authenticated the user. */
	onAuth: (payload: TelegramAuthInput) => void;
	/** Telegram widget visual options (sensible defaults for the dark auth card). */
	cornerRadius?: number;
	requestAccess?: boolean;
}

// A counter keeps each mounted widget's global callback unique, since the
// Telegram script invokes a function by name on `window`.
let callbackSeq = 0;

/**
 * Renders Telegram's official Login Widget (telegram-widget.js). The widget is
 * the ONLY way to obtain a signed payload the backend will accept — its `hash`
 * is HMAC-verified server-side, so we cannot synthesize it.
 *
 * Requires NEXT_PUBLIC_TELEGRAM_BOT_USERNAME; renders nothing if it is missing
 * (keeps the feature fully additive — password login is unaffected).
 */
const TelegramLoginButton = ({ onAuth, cornerRadius = 10, requestAccess = false }: TelegramLoginButtonProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const onAuthRef = useRef(onAuth);
	onAuthRef.current = onAuth;

	const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

	useEffect(() => {
		if (!botUsername || !containerRef.current) return;

		callbackSeq += 1;
		const callbackName = `onTelegramAuth_${callbackSeq}`;
		(window as any)[callbackName] = (user: TelegramAuthInput) => onAuthRef.current(user);

		const script = document.createElement('script');
		script.src = 'https://telegram.org/js/telegram-widget.js?22';
		script.async = true;
		script.setAttribute('data-telegram-login', botUsername);
		script.setAttribute('data-size', 'large');
		script.setAttribute('data-radius', String(cornerRadius));
		script.setAttribute('data-onauth', `${callbackName}(user)`);
		if (requestAccess) script.setAttribute('data-request-access', 'write');

		const container = containerRef.current;
		container.appendChild(script);

		return () => {
			container.innerHTML = '';
			delete (window as any)[callbackName];
		};
	}, [botUsername, cornerRadius, requestAccess]);

	if (!botUsername) return null;

	return <div ref={containerRef} className="au-telegram" />;
};

export default TelegramLoginButton;
