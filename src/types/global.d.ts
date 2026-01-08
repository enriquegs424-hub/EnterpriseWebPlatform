// Global typing status cache
// In production, replace with Redis
declare global {
    var typingStatus: Map<string, {
        userId: string;
        userName: string;
        timestamp: number;
    }> | undefined;
}

export { };
