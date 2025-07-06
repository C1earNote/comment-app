import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, password: hash });
    return this.userRepo.save(user);
  }

  async login(username: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'password'], // explicitly select password
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findById(id: number) {
    return this.userRepo.findOneBy({ id });
  }
}