import { useState, useEffect, useCallback, useRef } from 'react';

const useWebSocket = (url, onMessage) => {
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    const connect = useCallback(() => {
        if (!url) return;

        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (onMessage) onMessage(data);
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            // Attempt reconnection after 3 seconds
            setTimeout(connect, 3000);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws.current.close();
        };
    }, [url, onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    const send = useCallback((data) => {
        if (ws.current && isConnected) {
            ws.current.send(JSON.stringify(data));
        }
    }, [isConnected]);

    return { isConnected, send };
};

export default useWebSocket;
