import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Orders, OrdersSchema } from '../orders/orders.schema';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { User, UserSchema } from '../users/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Orders.name, schema: OrdersSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [ManagerService],
  controllers: [ManagerController],
  exports: [ManagerService],
})

export class ManagerModule {}
