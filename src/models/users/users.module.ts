import { Module, OnModuleInit } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './users.schema';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { Model, Types } from 'mongoose';
import { hashPassword } from 'src/helpers';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async onModuleInit() {
    const exists = await this.userModel.exists({
      _id: '688a6a5d080657f388036dc8',
    });
    if (!exists) {
      await this.userModel.create({
        _id: new Types.ObjectId('688a6a5d080657f388036dc8'),
        username: 'admin',
        password: hashPassword('owner'),
        fullName: 'Quản lý',
        gender: 'MALE',
        phone: '',
        position: 'OWNER',
      });
    }
  }
}
