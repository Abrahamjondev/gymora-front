import React, { useEffect, useRef, useState } from 'react';
import { CircularProgress, Stack } from '@mui/material';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CONVERSATIONS, GET_MESSAGE_HISTORY } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { REACT_APP_API_URL, Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import useSocket from '../../hooks/useSocket';

const ChatContent = () => {
	const user = useReactiveVar(userVar);
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
	const { loading: msgsLoading, refetch: msgsRefetch } = useQuery(GET_MESSAGE_HISTORY, {
		fetchPolicy: 'network-only',
		variables: { input: activePartner },
		skip: !activePartner,
		onCompleted: (d: T) => setMessages(d?.getMessageHistory ?? []),
	});

	useEffect(() => {
		if (activePartner) msgsRefetch({ input: activePartner });
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

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			{/* Connection status */}
			{!connected && user?._id && (
				<div style={{
					padding: '8px 16px', marginBottom: '12px', borderRadius: '8px',
					background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)',
					fontFamily: 'JetBrains Mono', fontSize: '11px', color: '#ff8a00',
					display: 'flex', alignItems: 'center', gap: '8px',
				}}>
					<CircularProgress size={12} sx={{ color: '#ff8a00' }} />
					Connecting to chat server...
				</div>
			)}

			<div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0', height: 'calc(100vh - 240px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
				{/* Left — Conversations */}
				<div style={{ background: '#1c1b1c', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
					<div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e5e2e3' }}>Messages</h3>
						{connected && (
							<div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#66daba', boxShadow: '0 0 6px rgba(102,218,186,0.5)' }} />
						)}
					</div>
					<div style={{ flex: 1, overflow: 'auto' }}>
						{convsLoading ? <Stack sx={{ p: 4, alignItems: 'center' }}><CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} /></Stack> :
						conversations.length === 0 ? <p style={{ padding: '20px', color: '#9aabab', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>No conversations yet.</p> :
						conversations.map((conv: any) => (
							<div key={conv.partnerId} onClick={() => setActivePartner(conv.partnerId)} style={{
								padding: '14px 20px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
								background: activePartner === conv.partnerId ? 'rgba(0,220,229,0.08)' : 'transparent',
								borderLeft: activePartner === conv.partnerId ? '3px solid #00dce5' : '3px solid transparent',
								transition: 'all 0.15s ease',
							}}>
								<div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b', flexShrink: 0, position: 'relative' }}>
									<img src={conv.partnerImage ? `${REACT_APP_API_URL}/${conv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									{conv.isOnline && <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: '#66daba', border: '2px solid #1c1b1c' }} />}
								</div>
								<div style={{ flex: 1, overflow: 'hidden' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{conv.partnerNick || 'User'}</span>
										{!conv.isRead && conv.lastMessage && (
											<div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00dce5', flexShrink: 0 }} />
										)}
									</div>
									<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: '#849495', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{conv.lastMessage}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Right — Chat */}
				<div style={{ display: 'flex', flexDirection: 'column', background: '#131314' }}>
					{activePartner ? (
						<>
							{/* Header */}
							<div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
								<div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b', position: 'relative' }}>
									<img src={activeConv?.partnerImage ? `${REACT_APP_API_URL}/${activeConv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									{activeConv?.isOnline && <div style={{ position: 'absolute', bottom: '0', right: '0', width: '8px', height: '8px', borderRadius: '50%', background: '#66daba', border: '2px solid #131314' }} />}
								</div>
								<div>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{activeConv?.partnerNick || 'User'}</span>
									{activeConv?.isOnline && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#66daba', marginLeft: '8px' }}>ONLINE</span>}
								</div>
							</div>

							{/* Messages */}
							<div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{msgsLoading ? <Stack sx={{ alignItems: 'center', py: 4 }}><CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} /></Stack> :
								messages.map((msg: any, idx: number) => {
									const isMine = msg.senderId === user._id;
									return (
										<div key={msg._id || idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
											<div style={{
												padding: '10px 14px',
												borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
												background: isMine ? 'rgba(0,220,229,0.12)' : 'rgba(255,255,255,0.05)',
												border: `1px solid ${isMine ? 'rgba(0,220,229,0.2)' : 'rgba(255,255,255,0.06)'}`,
											}}>
												<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3', lineHeight: '20px' }}>{msg.message}</p>
											</div>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginTop: '3px', display: 'block', textAlign: isMine ? 'right' : 'left' }}>
												{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
											</span>
										</div>
									);
								})}
								<div ref={messagesEndRef} />
							</div>

							{/* Input */}
							<div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px' }}>
								<input
									value={messageText}
									onChange={(e) => setMessageText(e.target.value)}
									onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendHandler()}
									placeholder={connected ? 'Type your message...' : 'Connecting...'}
									disabled={!connected}
									style={{
										flex: 1, padding: '12px 16px',
										background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
										borderRadius: '10px', color: '#e5e2e3',
										fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none',
										opacity: connected ? 1 : 0.5,
									}}
								/>
								<button
									onClick={sendHandler}
									disabled={!connected || !messageText.trim()}
									style={{
										background: connected && messageText.trim() ? '#00dce5' : 'rgba(0,220,229,0.2)',
										color: '#003739', border: 'none', borderRadius: '10px',
										padding: '12px 20px', fontFamily: 'Hanken Grotesk', fontSize: '14px',
										fontWeight: 700, cursor: connected && messageText.trim() ? 'pointer' : 'not-allowed',
										transition: 'all 0.2s ease',
									}}
								>
									→
								</button>
							</div>
						</>
					) : (
						<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
							<div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,220,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<span style={{ fontSize: '20px', color: '#00dce5' }}>◬</span>
							</div>
							<p style={{ color: '#9aabab', fontFamily: 'Hanken Grotesk', fontSize: '15px' }}>Select a conversation</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatContent;
