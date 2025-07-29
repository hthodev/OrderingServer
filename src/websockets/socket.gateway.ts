import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';
import USER from "../constants/users"

@WebSocketGateway({ cors: true })
@Injectable()
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    const role = client.handshake.query.role;
    if (role === USER.POSITION.COOKING) {
      client.join(USER.POSITION.COOKING); // Join room 'cooking'
    }
  }

  notifyTableUpdate() {
    this.server.emit('TABLE_UPDATE'); // broadcast toàn bộ
  }

  newOrder(data) {
    this.server.to(USER.POSITION.COOKING).emit('NEW_ORDER', { data });
  }
}
