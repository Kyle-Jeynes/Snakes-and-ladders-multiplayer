import IPlayer from "../interfaces/player";

export default class PlayerService {
    private players: Map<string, IPlayer>;

    constructor() {
        this.players = new Map<string, IPlayer>();
    }

    addPlayer(playerId: string, player: IPlayer): void {
        this.players.set(playerId, player);
    }

    getPlayer(playerId: string): IPlayer | undefined {
        return this.players.get(playerId);
    }

    removePlayer(playerId: string): boolean {
        return this.players.delete(playerId);
    }

    getAllPlayers(): Map<string, IPlayer> {
        return this.players;
    }

    clearPlayers(): void {
        this.players.clear();
    }

    playerCount(): number {
        return this.players.size;
    }
};