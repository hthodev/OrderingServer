import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './configs/database.module';
import { FoodModule } from './models/food/food.module';
import { OrdersModule } from './models/orders/orders.module';
import { TableModule } from './models/tables/tables.module';
import { UserModule } from './models/users/users.module';
import { FoodController } from './models/food/food.controller';
import { OrdersController } from './models/orders/orders.controller';
import { TableController } from './models/tables/tables.controller';
import { UserController } from './models/users/users.controller';
import { JwtMiddleware } from './commons/middlewares/jwt.middleware';

@Module({
  imports: [
    DatabaseModule,
    FoodModule,
    OrdersModule,
    TableModule,
    UserModule,
  ],
  controllers: [
    AppController,
    FoodController,
    OrdersController,
    TableController,
    UserController,
  ],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude({ path: '/users/login', method: RequestMethod.POST })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
