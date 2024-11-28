
import Phaser from 'phaser';

const serverUrl = 'ws://localhost:3000';
const socket = new WebSocket(serverUrl);

let players = {}; // Store player data

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.otherPlayers = {}; // Store other players' sprites
  }

  preload() {
    // Load assets
    this.load.image('player', '/assets/player1.png'); // Player image
    this.load.image('tree', '/assets/tree.png'); // Tree image
    this.load.image('rock', '/assets/rock.png'); // Rock image
  }

  create() {
    this.playerId = Math.random().toString(36).substring(2, 9);
    this.player = this.physics.add.sprite(100, 100, 'player').setScale(0.2);
    this.player.setCollideWorldBounds(true);

    this.player.setSize(this.player.width * 0.35, this.player.height * 0.7);
    this.player.setOffset(this.player.width * 0.33, this.player.height * 0.2);

    this.cursors = this.input.keyboard.createCursorKeys();

    // Add static elements (trees and rocks)
    // this.trees = this.physics.add.staticGroup();
    // this.trees.create(200, 200, 'tree');

    this.trees = this.physics.add.staticGroup();
    const tree = this.trees.create(200, 200, 'tree').setScale(0.5); // Tree size reduced
    tree.setSize(tree.width * 0.3, tree.height * 0.4);
    tree.setOffset(tree.width * 0.36, tree.height * 0.32);

    this.rocks = this.physics.add.staticGroup();
    const rock = this.rocks.create(400, 300, 'rock').setScale(0.5); // Rock size reduced
    rock.setSize(rock.width * 0.2, rock.height * 0.25)
    rock.setOffset(rock.width * 0.4, rock.height * 0.38);

    this.physics.add.collider(this.player, this.trees);
    this.physics.add.collider(this.player, this.rocks);

    // WebSocket event listeners
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'state') {
        players = data.players;
      }
    });
  }

  update() {
    const speed = 200;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }

    // Send player position to server
    socket.send(
      JSON.stringify({
        type: 'update',
        id: this.playerId,
        x: this.player.x,
        y: this.player.y,
      })
    );

    // Clear and update other players
    Object.keys(this.otherPlayers).forEach((id) => {
      if (!players[id]) {
        // Remove disconnected players
        this.otherPlayers[id].destroy();
        delete this.otherPlayers[id];
      }
    });

    Object.keys(players).forEach((id) => {
      if (id !== this.playerId) {
        if (!this.otherPlayers[id]) {
          // Add new players
          this.otherPlayers[id] = this.add.sprite(players[id].x, players[id].y, 'player').setScale(0.2);
        } else {
          // Update existing players' positions
          this.otherPlayers[id].setPosition(players[id].x, players[id].y);
        }
      }
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: GameScene,
};

new Phaser.Game(config);
