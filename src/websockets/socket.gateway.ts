import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: true })
@Injectable()
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  notifyTableUpdate() {
    this.server.emit('TABLE_UPDATE');
  }

}
