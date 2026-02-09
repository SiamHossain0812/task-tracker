import React, { useState, useEffect } from 'react';
import { Bell, X, Settings } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationPrompt = () => {
    const [show, setShow] = useState(false);
    const [permission, setPermission] = useState(Notification.permission);
    const { registerPush } = useNotifications();

    useEffect(() => {
        // Show prompt if permission is default (not yet asked) or denied
        const dismissed = localStorage.getItem('notification_prompt_v2_dismissed');
        if ((Notification.permission === 'default' || Notification.permission === 'denied') && !dismissed) {
            setShow(true);
        }

        // Update permission state when it changes
        const interval = setInterval(() => {
            if (Notification.permission !== permission) {
                setPermission(Notification.permission);
                if (Notification.permission === 'granted') {
                    setShow(false);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [permission]);

    const handleEnable = async () => {
        console.log('🔔 Enable button clicked');
        console.log('Current permission state:', permission);
        console.log('Notification.permission:', Notification.permission);

        if (permission === 'default') {
            console.log('Permission is default, requesting...');
            try {
                const result = await Notification.requestPermission();
                console.log('Permission request result:', result);
                setPermission(result);

                if (result === 'granted') {
                    console.log('Permission granted! Proceeding with setup...');
                    setShow(false);
                    // Register functionality with backend immediately
                    console.log('Calling registerPush...');
                    registerPush();

                    // Show a test notification
                    if ('serviceWorker' in navigator) {
                        console.log('Service worker available, showing test notification...');
                        const registration = await navigator.serviceWorker.ready;
                        await registration.showNotification('Notifications Enabled! 🎉', {
                            body: 'You will now receive instant updates',
                            icon: '/logo192.png',
                            badge: '/logo192.png',
                            vibrate: [200, 100, 200]
                        });
                        console.log('Test notification shown successfully');
                    }
                } else {
                    console.log('Permission not granted:', result);
                }
            } catch (error) {
                console.error('Failed to request notification permission:', error);
            }
        } else {
            console.log('Permission is not default, current value:', permission);
        }
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('notification_prompt_v2_dismissed', 'true');
    };

    // Don't show if permission granted or user dismissed
    if (!show || permission === 'granted') {
        return null;
    }

    const isDenied = permission === 'denied';

    return (
        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50 animate-slide-up">
            <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={20} />
            </button>

            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full ${isDenied ? 'bg-amber-100' : 'bg-emerald-100'} flex items-center justify-center flex-shrink-0`}>
                    {isDenied ? <Settings className="text-amber-600" size={24} /> : <Bell className="text-emerald-600" size={24} />}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {isDenied ? 'Notifications Blocked' : 'Enable Notifications'}
                    </h3>

                    {isDenied ? (
                        <>
                            <p className="text-sm text-gray-600 mb-3">
                                To receive instant task alerts, enable notifications in your browser:
                            </p>
                            <ol className="text-xs text-gray-600 mb-4 space-y-1 list-decimal list-inside">
                                <li>Tap the <strong>lock icon</strong> in the address bar</li>
                                <li>Tap <strong>"Permissions"</strong> or <strong>"Site settings"</strong></li>
                                <li>Find <strong>"Notifications"</strong></li>
                                <li>Change to <strong>"Allow"</strong></li>
                                <li>Refresh this page</li>
                            </ol>
                        </>
                    ) : (
                        <p className="text-sm text-gray-600 mb-4">
                            Get instant alerts when you're assigned to new tasks or meetings
                        </p>
                    )}

                    <div className="flex gap-2">
                        {!isDenied && (
                            <button
                                onClick={handleEnable}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                            >
                                Enable
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className={`${isDenied ? 'flex-1' : ''} px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors`}
                        >
                            {isDenied ? 'Got It' : 'Not Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPrompt;
