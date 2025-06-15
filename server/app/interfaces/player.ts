export default interface IPlayer {
    id: string;
    name: string | undefined;
    sockets: WebSocket[];
    isReady: boolean;
    token: string;
    isHost: boolean;
    roll: number | undefined;
    points: number,
    rolling: boolean,
    position: [number, number],
};