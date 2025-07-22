import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './users.service';
import { USERS } from 'src/constants/model';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  async login(@Body() { username, password }) {
    return await this.userService.login({ username, password });
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

  @Post('inActive')
  async inActive(@Param('_id') _id: string) {
    return await this.userService.inActive({ _id });
  }
}
