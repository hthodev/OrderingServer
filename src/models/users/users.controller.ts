import { Controller, Get, Post, Body, Param, HttpCode } from '@nestjs/common';
import { UserService } from './users.service';
import { USERS } from 'src/constants/model';
import { User } from 'src/commons/decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(200)
  @Post('login')
  async login(@Body() { username, password }) {
    return await this.userService.login({ username, password });
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() { refresh }) {
    return await this.userService.refreshToken(refresh);
  }

  @Post('create')
  async create(
    @Body()
    { username, password, fullName, gender, position = USERS.POSITION.STAFF },
  ) {
    return await this.userService.create({
      username,
      password,
      fullName,
      gender,
      position,
      
    });
  }

  @HttpCode(200)
  @Post('inActive')
  async inActive(@Param('_id') _id: string) {
    return await this.userService.inActive({ _id });
  }
}
