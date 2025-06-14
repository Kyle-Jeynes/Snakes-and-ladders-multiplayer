import IPlayer from "../interfaces/player";

export default class PlayService {
    private player: IPlayer | undefined;

    public setPlayer(player: IPlayer) {
        this.player = player;
    }

    public rollDice(): boolean {
        if (this.player && this.player.roll === undefined) {
            this.player.roll = Math.floor(Math.random() * 6) + 1;
            return true;
        }

        return false;
    }

    public async handlePlayerEvent(event: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.player) {
                return reject(new Error("Player not set in PlayService"));
            }

            // TODO: Handle different player events here
            console.log(`Player ${this.player!.id} sent an event ${event}`);
        });
    }
};