import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
import { useLazyQuery, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { userVar } from '../../../apollo/store';
import { GET_CONVERSATIONS, GET_MESSAGE_HISTORY, GET_MEMBER, GET_PARTNER_ONLINE_STATUS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { REACT_APP_API_URL, Messages, appLocale } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import useSocket from '../../hooks/useSocket';

const ChatContent = ({ onConversationsRead }: { onConversationsRead?: () => void }) => {
	const { t } = useTranslation('mypage');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const partnerParam = router.query?.partner as string | undefined;
	const { socket, connected } = useSocket();
	const [conversations, setConversations] = useState<any[]>([]);
	const [activePartner, setActivePartner] = useState<string | null>(null);
	// Live presence for the OPEN conversation, kept separate from the conversation
	// list so a conversations refetch can't wipe the lastSeen we resolved.
	const [partnerStatus, setPartnerStatus] = useState<{ isOnline: boolean; lastSeen?: string } | null>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [messageText, setMessageText] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Load conversations
	const { loading: convsLoading, refetch: convsRefetch } = useQuery(GET_CONVERSATIONS, {
		fetchPolicy: 'network-only', skip: !user?._id,
		onCompleted: (d: T) => setConversations(d?.getConversations ?? []),
	});

	// Load message history when partner changes
	// Live presence check for the open conversation (chat:online snapshot goes
	// stale — backend tracks onlineMembers in memory)
	const [checkPartnerOnline] = useLazyQuery(GET_PARTNER_ONLINE_STATUS, {
		fetchPolicy: 'network-only',
		onCompleted: (d: any) => {
			const st = d?.getPartnerOnlineStatus;
			if (!st?.memberId) return;
			// Drive the open-room header from this dedicated state (stable across refetches)
			if (st.memberId === activePartner) setPartnerStatus({ isOnline: st.isOnline, lastSeen: st.lastSeen });
			// Keep the list dot in sync too (no lastSeen needed there)
			setConversations((prev) => prev.map((c: any) => (c.partnerId === st.memberId ? { ...c, isOnline: st.isOnline } : c)));
		},
	});

	// Deep link: /mypage?category=chat&partner=<memberId> opens (or starts) that conversation
	const [fetchPartnerMember] = useLazyQuery(GET_MEMBER, {
		fetchPolicy: 'cache-and-network',
		onCompleted: (d: T) => {
			const m = d?.getMember;
			if (!m?._id) return;
			setConversations((prev) =>
				prev.some((c: any) => c.partnerId === m._id)
					? prev
					: [
							{
								partnerId: m._id,
								partnerNick: m.memberNick,
								partnerImage: m.memberImage,
								lastMessage: '',
								lastMessageAt: null,
								isRead: true,
								isOnline: false,
							},
							...prev,
					  ],
			);
		},
	});

	useEffect(() => {
		if (!partnerParam || !user?._id || partnerParam === user._id) return;
		setActivePartner(partnerParam);
	}, [partnerParam, user?._id]);

	// Open a conversation AND persist it in the URL so a refresh restores it
	// (state alone is lost on reload).
	const openConversation = (partnerId: string) => {
		setActivePartner(partnerId);
		router.push({ pathname: '/mypage', query: { category: 'chat', partner: partnerId } }, undefined, { shallow: true });
	};

	useEffect(() => {
		if (!partnerParam || convsLoading || partnerParam === user?._id) return;
		if (!conversations.some((c: any) => c.partnerId === partnerParam)) {
			fetchPartnerMember({ variables: { input: partnerParam } });
		}
	}, [partnerParam, convsLoading, conversations.length]);

	const { loading: msgsLoading, refetch: msgsRefetch } = useQuery(GET_MESSAGE_HISTORY, {
		fetchPolicy: 'network-only',
		variables: { input: activePartner },
		skip: !activePartner,
		onCompleted: (d: T) => setMessages(d?.getMessageHistory ?? []),
	});

	useEffect(() => {
		if (activePartner) {
			// Reset presence for the newly opened conversation until we re-resolve it,
			// so a previous partner's status never lingers.
			setPartnerStatus(null);
			// Opening a conversation marks its incoming messages read on the backend.
			// Optimistically clear the local unread flag and tell the parent so the
			// sidebar badge updates without waiting for a refresh/poll.
			setConversations((prev) => prev.map((c: any) => (c.partnerId === activePartner ? { ...c, isRead: true } : c)));
			msgsRefetch({ input: activePartner }).then(({ data }: any) => {
				// Set manually — refetch doesn't reliably re-fire onCompleted
				if (data?.getMessageHistory) setMessages(data.getMessageHistory);
				onConversationsRead?.();
			});
			checkPartnerOnline({ variables: { input: activePartner } });
		}
	}, [activePartner]);

	// Light polling while a conversation is open so read receipts (✓ → ✓✓) and
	// the partner's presence stay fresh without any backend changes. Pauses when
	// the tab is hidden.
	useEffect(() => {
		if (!activePartner) return;
		const tick = async () => {
			if (typeof document !== 'undefined' && document.hidden) return;
			const { data } = await msgsRefetch({ input: activePartner });
			if (data?.getMessageHistory) setMessages(data.getMessageHistory);
			checkPartnerOnline({ variables: { input: activePartner } });
		};
		const id = setInterval(tick, 6000);
		return () => clearInterval(id);
	}, [activePartner]);

	// Scroll the messages panel (not the whole page) to the latest message
	const msgsBoxRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const box = msgsBoxRef.current;
		if (box) box.scrollTop = box.scrollHeight;
	}, [messages]);

	// Socket.IO real-time listener
	useEffect(() => {
		if (!socket || !user?._id) return;

		const handleIncoming = (msg: any) => {
			const partnerId = msg.senderId === user._id ? msg.receiverId : msg.senderId;

			// If this message belongs to active conversation, append it
			if (activePartner && (partnerId === activePartner)) {
				setMessages((prev) => {
					if (prev.some((m) => m._id === msg._id)) return prev;
					return [...prev, msg];
				});
			}

			// Update conversation list
			setConversations((prev) => {
				const idx = prev.findIndex((c: any) => c.partnerId === partnerId);
				if (idx >= 0) {
					const updated = [...prev];
					updated[idx] = { ...updated[idx], lastMessage: msg.message, lastMessageAt: msg.createdAt };
					updated.sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
					return updated;
				}
				// New conversation — refetch to get partner info (set manually,
				// refetch doesn't reliably re-fire onCompleted)
				convsRefetch().then(({ data }: any) => {
					if (data?.getConversations) setConversations(data.getConversations);
				});
				return prev;
			});
		};

		socket.on('chat:message', handleIncoming);
		return () => { socket.off('chat:message', handleIncoming); };
	}, [socket, user?._id, activePartner]);

	// Send message via Socket.IO
	const sendHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!messageText.trim() || !activePartner || !socket) return;

			socket.emit('chat:message', {
				receiverId: activePartner,
				message: messageText,
			});

			setMessageText('');
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const activeConv = conversations.find((c: any) => c.partnerId === activePartner);

	const lastSeenLabel = (iso?: string) => {
		if (!iso) return t('chat.offline');
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60000);
		if (m < 1) return t('chat.lastSeenJustNow');
		if (m < 60) return t('chat.lastSeenMinutes', { n: m });
		const h = Math.floor(m / 60);
		if (h < 24) return t('chat.lastSeenHours', { n: h });
		const d = Math.floor(h / 24);
		if (d < 7) return t('chat.lastSeenDays', { n: d });
		return t('chat.lastSeenDate', { date: new Date(iso).toLocaleDateString(appLocale(), { month: 'short', day: 'numeric' }) });
	};

	const formatConvTime = (iso?: string) => {
		if (!iso) return '';
		const d = new Date(iso);
		const today = new Date();
		return d.toDateString() === today.toDateString()
			? d.toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' })
			: d.toLocaleDateString(appLocale(), { month: 'short', day: 'numeric' });
	};

	const dayLabel = (iso: string) => {
		const d = new Date(iso);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		if (d.toDateString() === today.toDateString()) return t('chat.today');
		if (d.toDateString() === yesterday.toDateString()) return t('chat.yesterday');
		return d.toLocaleDateString(appLocale(), { month: 'short', day: 'numeric' });
	};

	const formatMsgTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString(appLocale(), { hour: '2-digit', minute: '2-digit' }) : '');

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Connection status */}
			{!connected && user?._id && (
				<div className="ct-connecting">
					<CircularProgress size={12} sx={{ color: '#ffb77f' }} />
					{t('chat.connecting')}
				</div>
			)}

			<div className="ct-shell">
				{/* Left — Conversations */}
				<div className="ct-side">
					<div className="ct-side-head">
						<h3>{t('chat.header')}</h3>
						<span className={`ct-live${connected ? '' : ' is-off'}`}>
							<span className="ct-live-dot" />
							{connected ? t('chat.live') : t('chat.offline')}
						</span>
					</div>
					<div className="ct-convs">
						{convsLoading ? (
							<Stack sx={{ p: 4, alignItems: 'center' }}>
								<CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} />
							</Stack>
						) : conversations.length === 0 ? (
							<p style={{ padding: '20px', color: '#9aabab', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>{t('chat.noConversations')}</p>
						) : (
							conversations.map((conv: any) => (
								<div
									key={conv.partnerId}
									className={`ct-conv${activePartner === conv.partnerId ? ' is-active' : ''}`}
									onClick={() => openConversation(conv.partnerId)}
								>
									<div className="ct-conv-ava">
										<img src={conv.partnerImage ? `${REACT_APP_API_URL}/${conv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" />
										{conv.isOnline && <span className="ct-online" />}
									</div>
									<div className="ct-conv-main">
										<div className="ct-conv-top">
											<span className="ct-conv-nick">{conv.partnerNick || t('chat.userFallback')}</span>
											<span className="ct-conv-time">{formatConvTime(conv.lastMessageAt)}</span>
										</div>
										<p className="ct-conv-last">{conv.lastMessage || t('chat.startConversation')}</p>
									</div>
									{!conv.isRead && conv.lastMessage && <span className="ct-unread" />}
								</div>
							))
						)}
					</div>
				</div>

				{/* Right — Chat room */}
				<div className="ct-room">
					{activePartner ? (
						<>
							{/* Header */}
							<div className="ct-room-head">
								<div className="ct-room-ava">
									<img src={activeConv?.partnerImage ? `${REACT_APP_API_URL}/${activeConv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" />
									{partnerStatus?.isOnline && <span className="ct-online" />}
								</div>
								<div className="ct-room-id">
									<span className="ct-room-name">{activeConv?.partnerNick || t('chat.userFallback')}</span>
									{partnerStatus && (
										<span className={`ct-presence${partnerStatus.isOnline ? ' is-online' : ''}`}>
											<span className="ct-presence-dot" />
											{partnerStatus.isOnline ? t('chat.activeNow') : lastSeenLabel(partnerStatus.lastSeen)}
										</span>
									)}
								</div>
							</div>

							{/* Messages with day separators */}
							<div className="ct-msgs" ref={msgsBoxRef}>
								{msgsLoading ? (
									<Stack sx={{ alignItems: 'center', py: 4 }}>
										<CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} />
									</Stack>
								) : (
									messages.map((msg: any, idx: number) => {
										const isMine = msg.senderId === user._id;
										const prev = messages[idx - 1];
										const showDay =
											msg.createdAt && (!prev?.createdAt || new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString());
										return (
											<React.Fragment key={msg._id || idx}>
												{showDay && <span className="ct-day">{dayLabel(msg.createdAt)}</span>}
												<div className={`ct-bubble-row${isMine ? ' is-mine' : ''}`}>
													<div className="ct-bubble">
														<p>{msg.message}</p>
													</div>
													<span className="ct-time">
														{formatMsgTime(msg.createdAt)}
														{isMine && (
															<span className={`ct-receipt${msg.isRead ? ' is-read' : ''}`} title={msg.isRead ? t('chat.read') : t('chat.sent')}>
																{msg.isRead ? '✓✓' : '✓'}
															</span>
														)}
													</span>
												</div>
											</React.Fragment>
										);
									})
								)}
								<div ref={messagesEndRef} />
							</div>

							{/* Input */}
							<div className="ct-input-bar">
								<input
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendHandler()}
									placeholder={connected ? t('chat.inputPlaceholder') : t('chat.inputConnecting')}
									disabled={!connected}
								/>
								<button className="ct-send" onClick={sendHandler} disabled={!connected || !messageText.trim()}>
									{t('chat.send')}
								</button>
							</div>
						</>
					) : (
						<div className="ct-empty">
							<div className="ct-empty-ic">◬</div>
							<h4>{t('chat.emptyTitle')}</h4>
							<p>{t('chat.emptyDesc')}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatContent;
