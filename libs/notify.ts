import { initializeApollo } from '../apollo/client';
import { CREATE_NOTIFICATION } from '../apollo/user/mutation';

type NotifType = 'SYSTEM' | 'WORKOUT' | 'NUTRITION' | 'SUBSCRIPTION' | 'CHAT';

/**
 * Fire-and-forget notification to another member (backend resolver now honors
 * input.memberId as the receiver). Never notifies yourself, never throws —
 * a failed notification must not break the main action.
 */
export const notifyMember = (
	receiverId: string | undefined,
	selfId: string | undefined,
	notificationType: NotifType,
	notificationTitle: string,
	notificationMessage: string,
): void => {
	try {
		if (!receiverId || !selfId || String(receiverId) === String(selfId)) return;
		const client = initializeApollo();
		client
			.mutate({
				mutation: CREATE_NOTIFICATION,
				variables: { input: { memberId: String(receiverId), notificationType, notificationTitle, notificationMessage } },
			})
			.catch(() => {});
	} catch {
		// best-effort only
	}
};
