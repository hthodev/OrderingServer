import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Orders, OrdersSchema } from './orders.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Table, TableSchema } from '../tables/tables.schema';
import { SocketGateway } from 'src/websockets/socket.gateway';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Orders.name, schema: OrdersSchema },
      { name: Table.name, schema: TableSchema },
    ]),
  ],
  providers: [OrdersService, SocketGateway],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}