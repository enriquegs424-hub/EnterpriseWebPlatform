'use client';

import { Phone, Video } from 'lucide-react';

interface CallButtonsProps {
    chatId: string;
    chatName: string;
    isGroup?: boolean;
}

/**
 * Call buttons for initiating audio/video calls using Jitsi Meet
 */
export default function CallButtons({ chatId, chatName, isGroup = false }: CallButtonsProps) {

    const startCall = (withVideo: boolean) => {
        // Generate a unique room name based on chat ID
        const roomName = `mep-${chatId.replace(/[^a-zA-Z0-9]/g, '-')}`;

        // Jitsi Meet configuration
        const baseUrl = 'https://meet.jit.si';
        const config = new URLSearchParams({
            'config.startWithAudioMuted': 'false',
            'config.startWithVideoMuted': withVideo ? 'false' : 'true',
            'config.prejoinPageEnabled': 'false',
            'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
            'interfaceConfig.SHOW_BRAND_WATERMARK': 'false',
            'interfaceConfig.DEFAULT_BACKGROUND': '#1a1a1a',
        });

        const jitsiUrl = `${baseUrl}/${roomName}#${config.toString()}`;

        // Open in a new window with specific dimensions
        const callWindow = window.open(
            jitsiUrl,
            `call-${chatId}`,
            'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no'
        );

        if (callWindow) {
            callWindow.focus();
        }
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => startCall(false)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-400 hover:text-olive-600 dark:hover:text-olive-400"
                title="Llamada de audio"
            >
                <Phone className="w-5 h-5" />
            </button>
            <button
                onClick={() => startCall(true)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-600 dark:text-neutral-400 hover:text-olive-600 dark:hover:text-olive-400"
                title="Videollamada"
            >
                <Video className="w-5 h-5" />
            </button>
        </div>
    );
}
