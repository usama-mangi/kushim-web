import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDashboardStore } from '../store/useStore';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const addRecord = useDashboardStore((state) => state.addRecord);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketRef.current.on('recordUpdated', (record) => {
      console.log('Record updated:', record);
      addRecord(record);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [addRecord]);

  return socketRef.current;
};
