import React, { useEffect, useState } from 'react';
import { CircularProgress, Stack } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CONVERSATIONS, GET_MESSAGE_HISTORY } from '../../../apollo/user/query';
import { SEND_MESSAGE } from '../../../apollo/user/mutation';
import { T } from '../../types/common';
import { REACT_APP_API_URL, Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

const ChatContent = () => {
	const user = useReactiveVar(userVar);
	const [conversations, setConversations] = useState<any[]>([]);
	const [activePartner, setActivePartner] = useState<string | null>(null);
	const [messages, setMessages] = useState<any[]>([]);
	const [messageText, setMessageText] = useState('');

	const { loading: convsLoading } = useQuery(GET_CONVERSATIONS, { fetchPolicy: 'network-only', skip: !user?._id, onCompleted: (d: T) => setConversations(d?.getConversations ?? []) });
	const { loading: msgsLoading, refetch: msgsRefetch } = useQuery(GET_MESSAGE_HISTORY, { fetchPolicy: 'network-only', variables: { input: activePartner }, skip: !activePartner, onCompleted: (d: T) => setMessages(d?.getMessageHistory ?? []) });

	const [sendMessage] = useMutation(SEND_MESSAGE);

	useEffect(() => { if (activePartner) msgsRefetch({ input: activePartner }); }, [activePartner]);

	const sendHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!messageText.trim() || !activePartner) return;
			await sendMessage({ variables: { input: { receiverId: activePartner, message: messageText } } });
			setMessageText('');
			const { data } = await msgsRefetch({ input: activePartner });
			if (data?.getMessageHistory) setMessages(data.getMessageHistory);
		} catch (err: any) { sweetMixinErrorAlert(err.message).then(); }
	};

	const activeConv = conversations.find((c: any) => c.partnerId === activePartner);

	return (
		<div style={{ animation: 'fadeInUp 0.5s ease both' }}>
			<div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '0', height: 'calc(100vh - 240px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
				{/* Left — Conversations */}
				<div style={{ background: '#1c1b1c', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
					<div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
						<h3 style={{ fontFamily: 'Hanken Grotesk', fontSize: '20px', fontWeight: 700, color: '#e5e2e3' }}>Messages</h3>
					</div>
					<div style={{ flex: 1, overflow: 'auto' }}>
						{convsLoading ? <Stack sx={{ p: 4, alignItems: 'center' }}><CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} /></Stack> :
						conversations.length === 0 ? <p style={{ padding: '20px', color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '14px' }}>No conversations yet.</p> :
						conversations.map((conv: any) => (
							<div key={conv.partnerId} onClick={() => setActivePartner(conv.partnerId)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center', background: activePartner === conv.partnerId ? 'rgba(0,220,229,0.1)' : 'transparent', borderLeft: activePartner === conv.partnerId ? '3px solid #00dce5' : '3px solid transparent' }}>
								<div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b', flexShrink: 0, position: 'relative' }}>
									<img src={conv.partnerImage ? `${REACT_APP_API_URL}/${conv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									{conv.isOnline && <div style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '10px', borderRadius: '50%', background: '#66daba', border: '2px solid #1c1b1c' }} />}
								</div>
								<div style={{ flex: 1, overflow: 'hidden' }}>
									<div style={{ display: 'flex', justifyContent: 'space-between' }}>
										<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 600, color: '#e5e2e3' }}>{conv.partnerNick || 'User'}</span>
									</div>
									<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: '#849495', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage}</p>
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
								<div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#2a2a2b' }}>
									<img src={activeConv?.partnerImage ? `${REACT_APP_API_URL}/${activeConv.partnerImage}` : '/img/profile/defaultUser.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
								</div>
								<div>
									<span style={{ fontFamily: 'Hanken Grotesk', fontSize: '16px', fontWeight: 600, color: '#e5e2e3' }}>{activeConv?.partnerNick || 'User'}</span>
									{activeConv?.isOnline && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#66daba', marginLeft: '8px' }}>ONLINE</span>}
								</div>
							</div>

							{/* Messages */}
							<div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
								{msgsLoading ? <Stack sx={{ alignItems: 'center', py: 4 }}><CircularProgress sx={{ color: '#00dce5' }} size={'2rem'} /></Stack> :
								messages.map((msg: any) => {
									const isMine = msg.senderId === user._id;
									return (
										<div key={msg._id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
											<div style={{ padding: '12px 16px', borderRadius: isMine ? '12px 12px 0 12px' : '12px 12px 12px 0', background: isMine ? 'rgba(0,220,229,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isMine ? 'rgba(0,220,229,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
												<p style={{ fontFamily: 'Hanken Grotesk', fontSize: '14px', color: '#e5e2e3', lineHeight: '20px' }}>{msg.message}</p>
											</div>
											<span style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', color: '#849495', marginTop: '4px', display: 'block', textAlign: isMine ? 'right' : 'left' }}>
												{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</span>
										</div>
									);
								})}
							</div>

							{/* Input */}
							<div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '12px' }}>
								<input value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendHandler()} placeholder="Type your message..." style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid #3a494a', borderRadius: '8px', color: '#e5e2e3', fontFamily: 'Hanken Grotesk', fontSize: '14px', outline: 'none' }} />
								<button onClick={sendHandler} style={{ background: '#00dce5', color: '#003739', border: 'none', borderRadius: '8px', padding: '12px 20px', fontFamily: 'Hanken Grotesk', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>→</button>
							</div>
						</>
					) : (
						<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<p style={{ color: '#849495', fontFamily: 'Hanken Grotesk', fontSize: '16px' }}>Select a conversation to start chatting</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ChatContent;
