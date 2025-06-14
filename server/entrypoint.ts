import { container } from "./app/services/container";
import ConnectionBootstrapper from "./app/bootstrappers/connectionBootstrapper";
import PlayerService from "./app/services/players";
import WebSocketServerService from "./app/services/websocket";
import { Game } from "./app/services/game";
import MapGenerator from "./app/services/map";

// Create default list of available servers
const availableGames: Game[] = [new Game(8080)];

// For now, we'll single thread and support only one game instance
availableGames.forEach((gameInstance) => {

    // Register the services and bootstrappers
    container.register("ConnectionBootstrapper", ConnectionBootstrapper);
    container.register("PlayerService", PlayerService, true);
    container.register("MapGeneratorService", MapGenerator);

    // Bind the game instance to the container
    container.bind("GameService", gameInstance);

    // Start the server
    new WebSocketServerService(gameInstance.getPort(), container).start();
});