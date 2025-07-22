import { genSaltSync, hashSync, compareSync } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { HttpException } from '@nestjs/common';
dotenv.config();

export function signToken(user) {
  const privateKey = process.env.PRIVATE_KEY?.replace(/\\n/g, '\n')!;

  if ('password' in user) {
    delete user.password;
  }
  return {
    token: sign(
      {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        image: user.image,
        position: user.position,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
      },
      privateKey,
      { algorithm: 'RS256' },
    ),
    refresh: sign(
      {
        _id: user._id,
      },
      privateKey,
      { algorithm: 'RS256' },
    ),
  };
}

export function verifyRefreshToken(token) {
  const publicKey = process.env.PUBLIC_KEY?.replace(/\\n/g, '\n');
  const decoded: any = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  if (!decoded) return null;
  return decoded._id;
}

export function hashPassword(password) {
  const saltRounds = 10;
  const salt = genSaltSync(saltRounds);
  return hashSync(password, salt);
}

export function comparePassword(password, hashPassworded) {
  return compareSync(password, hashPassworded);
}
