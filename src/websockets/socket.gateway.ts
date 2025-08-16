import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import USER from '../constants/users';

@WebSocketGateway({ cors: true, transports: ['websocket'] })
@Injectable()
export class SocketGateway {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    const role = client.handshake.query.role as string;
    if (Object.values(USER.POSITION).includes(role as any)) {
      client.join(role);
    }
  }

  notifyTableUpdate() {
    this.server.emit('TABLE_UPDATE');
  }

  newOrder(data: any) {
    const roles = [
      USER.POSITION.COOKING,
      USER.POSITION.MANAGER,
      USER.POSITION.OWNER,
    ];
    this.server.to(roles).emit('NEW_ORDER', { data });
  }

  // --- PING/PONG ---
  @SubscribeMessage('PING')
  handlePing(
    @MessageBody() payload: { ts?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const now = Date.now();
    // echo lại ts client gửi để client đo round-trip time
    client.emit('PONG', { ts: payload?.ts ?? now, serverNow: now });
  }
}
