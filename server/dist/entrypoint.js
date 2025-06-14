"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("./app/services/container");
const connectionBootstrapper_1 = __importDefault(require("./app/bootstrappers/connectionBootstrapper"));
const players_1 = __importDefault(require("./app/services/players"));
const websocket_1 = __importDefault(require("./app/services/websocket"));
const game_1 = require("./app/services/game");
const map_1 = __importDefault(require("./app/services/map"));
// Create default list of available servers
const availableGames = [new game_1.Game(8080)];
// For now, we'll single thread and support only one game instance
availableGames.forEach((gameInstance) => {
    // Bind the game instance to the container
    container_1.container.bind("GameService", gameInstance);
    // Register the services and bootstrappers
    container_1.container.register("ConnectionBootstrapper", connectionBootstrapper_1.default);
    container_1.container.register("PlayerService", players_1.default, true);
    container_1.container.register("WebSocketServerService", websocket_1.default, true);
    container_1.container.register("MapGeneratorService", map_1.default);
    // Start the server
    const wsService = container_1.container.resolve("WebSocketServerService");
    wsService.configurePort(gameInstance.getPort());
    wsService.start();
});
