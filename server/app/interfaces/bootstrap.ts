import IContainer from "./container";
import WebSocket from "ws";

export default interface IBootstrap {
    boot: (container: IContainer, socket: WebSocket, requestId: string|null, requestToken: string|null) => Promise<string>;
    shutdown: (container: IContainer, socket: WebSocket, playerId: string) => Promise<void>;
};