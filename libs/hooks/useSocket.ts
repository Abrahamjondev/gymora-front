import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { getJwtToken } from '../auth';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003';

let sharedSocket: Socket | null = null;
let refCount = 0;

const getSocket = (): Socket | null => {
	const token = getJwtToken();
	if (!token) return null;

	if (!sharedSocket || sharedSocket.disconnected) {
		sharedSocket = io(SOCKET_URL, {
			transports: ['websocket'],
			auth: { token },
			withCredentials: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 2000,
		});
	}
	return sharedSocket;
};

export const useSocket = () => {
	const user = useReactiveVar(userVar);
	const [connected, setConnected] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		if (!user?._id) return;

		const socket = getSocket();
		if (!socket) return;

		socketRef.current = socket;
		refCount++;

		const onConnect = () => setConnected(true);
		const onDisconnect = () => setConnected(false);

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);

		if (socket.connected) setConnected(true);
		else socket.connect();

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			refCount--;
			if (refCount <= 0 && sharedSocket) {
				sharedSocket.disconnect();
				sharedSocket = null;
				refCount = 0;
			}
		};
	}, [user?._id]);

	return { socket: socketRef.current, connected };
};

export default useSocket;
