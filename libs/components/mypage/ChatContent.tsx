import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { CircularProgress, Stack } from '@mui/material';
import { useLazyQuery, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CONVERSATIONS, GET_MESSAGE_HISTORY, GET_MEMBER, GET_PARTNER_ONLINE_STATUS } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { REACT_APP_API_URL, Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import useSocket from '../../hooks/useSocket';

const ChatContent = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const partnerParam = router.query?.partner as string | undefined;
	const { socket, connected } = useSocket();
	const [conversations, setConversations] = useState<any[]>([]);
	const [activePartner, setActivePartner] = useState<string | null>(null);
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
			msgsRefetch({ input: activePartner });
			checkPartnerOnline({ variables: { input: activePartner } });
		}
	}, [activePartner]);

	// Scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
				// New conversation — refetch to get partner info
				convsRefetch();
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

	const formatConvTime = (iso?: string) => {
		if (!iso) return '';
		const d = new Date(iso);
		const today = new Date();
		return d.toDateString() === today.toDateString()
			? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			: d.toLocaleDateString([], { month: 'short', day: 'numeric' });
	};

	const dayLabel = (iso: string) => {
		const d = new Date(iso);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);
		if (d.toDateString() === today.toDateString()) return 'Today';
		if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
		return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
	};

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Connection status */}
			{!connected && user?._id && (
				<div className="ct-connecting">
					<CircularProgress size={12} sx={{ color: '#ffb77f' }} />
					Connecting to chat server...
				</div>
			)}

			<div className="ct-shell">
				{/* Left — Conversations */}
				<div className="ct-side">
					<div className="ct-side-head">
						<h3>Messages</h3>
						<span className={`ct-live${connected ? '' : ' is-off'}`}>
							<span className="ct-live-dot" />
							{connected ? 'Live' : 'Offline'}
						</span>
					</div>
					<div className="ct-convs">
						{convsLoading ? (
							<Stack sx={{ p: 4, alignItems: 'center' }}>
								<CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} />
							</Stack>
						) : conversations.length === 0 ? (
							<p style={{ padding: '20px', color: '#9aabab', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>No conversations yet.</p>
						) : (
							conversations.map((conv: any) => (
								<div
									key={conv.partnerId}
									className={`ct-conv${activePartner === conv.partnerId ? ' is-active' : ''}`}
									onClick={() => setActivePartner(conv.partnerId)}
								>
									<div className="ct-conv-ava">
										<img src={conv.partnerImage ? `${REACT_APP_API_URL}/${conv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" />
										{conv.isOnline && <span className="ct-online" />}
									</div>
									<div className="ct-conv-main">
										<div className="ct-conv-top">
											<span className="ct-conv-nick">{conv.partnerNick || 'User'}</span>
											<span className="ct-conv-time">{formatConvTime(conv.lastMessageAt)}</span>
										</div>
										<p className="ct-conv-last">{conv.lastMessage || 'Start the conversation'}</p>
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
								</div>
								<span className="ct-room-name">{activeConv?.partnerNick || 'User'}</span>
								{activeConv?.isOnline && (
									<span className="ct-live">
										<span className="ct-live-dot" />
										Online
									</span>
								)}
							</div>

							{/* Messages with day separators */}
							<div className="ct-msgs">
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
														{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
									placeholder={connected ? 'Type your message...' : 'Connecting...'}
									disabled={!connected}
								/>
								<button className="ct-send" onClick={sendHandler} disabled={!connected || !messageText.trim()}>
									Send →
								</button>
							</div>
						</>
					) : (
						<div className="ct-empty">
							<div className="ct-empty-ic">◬</div>
							<h4>Your messages</h4>
							<p>Select a conversation to start chatting.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatContent;
