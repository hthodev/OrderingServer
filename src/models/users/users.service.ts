import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';
import { comparePassword, hashPassword, signToken, verifyRefreshToken } from 'src/helpers';
import { USERS } from 'src/constants/model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async findUser(where: object, select?: string) {
    const user = await this.userModel.findOne(where).lean().select(select);

    return user;
  }

  async login({ username, password }) {
    const user = await this.findUser(
      { username }
    );

    if (!user || !user.isActive) {
      throw new HttpException('The account not found!', 400);
    }
    if (!(await comparePassword(password, user.password))) {
      throw new HttpException('Password incorrect!', 400);
    }

    return signToken(user);
  }

  async refreshToken(token) {
    const _id = verifyRefreshToken(token)
    if (!_id) throw new HttpException('Invalid token', 400);
    const user = await this.findUser({ _id })
    return signToken(user)
  }

  async create({
    username,
    password,
    fullName,
    gender,
    position = USERS.POSITION.STAFF,
  }) {
    const user = await this.findUser(
      { username },
      'username password isActive',
    );

    if (user) {
      throw new HttpException('The username existed!', 400);
    }

    await this.userModel.create({
      username,
      password: hashPassword(password),
      fullName,
      gender,
      position,
    });

    return { success: true };
  }

  async inActive({ _id }) {
    const user = await this.findUser({ _id }, 'username password isActive');

    if (user) {
      throw new HttpException('The username existed!', 400);
    }

    return this.userModel.updateOne({ _id }, { $set: { isActive: false } });
  }
}
