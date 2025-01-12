import { Payloads, TileState } from '@shared/Payloads';
import { ClientId } from 'network/client';
import { Lobby } from 'network/lobby';

export class Minesweeper {
    private board : Tile[][];
    constructor(private readonly lobby: Lobby,
        private width,
        private height,
        private bombs
    ) {
        this.initializeBoard();
    }

    public startGame() {
        this.lobby.emitGameStart();
    }

    initializeBoard() {
        this.board = [];
        for (let x = 0; x < this.width; x++) {
            this.board.push([])
            for (let y = 0; y < this.height; y++) {
                this.board[x][y] = new Tile();
            }
        }
        this.plantBombs(this.board);
        this.updateHints(this.board);
    }

    plantBombs(board : Tile[][]) : void {
        let bombsPlanted = 0;
        while (bombsPlanted < this.bombs) {
            let randX = getRandomInt(this.width);
            let randY = getRandomInt(this.height);
            if (!board[randX][randY].isBomb) { 
                board[randX][randY].isBomb = true;
                bombsPlanted++;
            }
        }
    }

    updateHints(board : Tile[][]) : void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let bombs = 0;
                this.getNeighbors(board, x, y).map(tile => {
                    if (tile.isBomb) {
                        bombs++;
                    }
                });
                board[x][y].hint = bombs;
            }
        }
    }

    getNeighbors(board: Tile[][], x: number, y: number): Tile[] {
        let neighbors = [];
        if (this.inBounds(x - 1, y - 1)) {
            neighbors.push(board[x - 1][y - 1]);
        }
        if (this.inBounds(x - 1, y)) {
            neighbors.push(board[x - 1][y]);
        }
        if (this.inBounds(x - 1, y + 1)) {
            neighbors.push(board[x - 1][y + 1]);
        }
        if (this.inBounds(x, y + 1)) {
            neighbors.push(board[x][y + 1]);
        }
        if (this.inBounds(x + 1, y + 1)) {
            neighbors.push(board[x + 1][y + 1]);
        }
        if (this.inBounds(x + 1, y)) {
            neighbors.push(board[x + 1][y]);
        }
        if (this.inBounds(x + 1, y - 1)) {
            neighbors.push(board[x + 1][y - 1]);
        }
        if (this.inBounds(x, y - 1)) {
            neighbors.push(board[x][y - 1]);
        }
        return neighbors;
    }

    inBounds(x: number, y: number) : boolean {
        return x >= 0 && x < this.width && y >0 && y < this.height;
    }

    public getGameboardState(_clientId: ClientId) : Payloads.GameboardState  {
        const state = []
        for (let x = 0; x < this.width; x++) {
            state.push([])
            for (let y = 0; y < this.height; y++) {
                state[x][y] = this.tileToTileState(this.board[x][y]);
            }
        }

        return {
            tiles: state,
            height: this.height,
            width: this.width,
        };
    }

    private tileToTileState(tile: Tile) : TileState {
        if (tile.isHidden) {
            return 'hidden';
        } 
        if (tile.isBomb) {
            return 'bomb';
        } 
        if (tile.hint == 0) {
            return 'blank';
        }
        return tile.hint;
    }

    validateMove(move: Payloads.ClientMove) : boolean {
        switch(move.type) {
            case 'reveal':
                if (!this.inBounds(move.x, move.y)) {
                    return false;
                }
                let tile = this.board[move.x][move.y];
                if (!tile.isHidden) {
                    return false;
                }
                break;
            default:
                break;
        }
        return true;
    }

    executeMove(move: Payloads.ClientMove) : void {
        switch(move.type) {
            case 'reveal':
                this.board[move.x][move.y].isHidden = false;
                break;
            default:
                break;
        }
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

class Tile {
    public isHidden = false;
    public isBomb;
    public hint : number;
}