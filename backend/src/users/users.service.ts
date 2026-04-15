import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { username, password, fullName } = createUserDto;
    const existing = await this.userModel.findOne({ username });
    if (existing) throw new ConflictException('Username already taken');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = new this.userModel({ username, fullName, password: hashedPassword });
    const savedUser = await createdUser.save();
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword as Omit<User, 'password'>;
  }

  async validateUser(username: string, password: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as Omit<User, 'password'>;
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userModel.findById(id);
    if (!user) return null;
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as Omit<User, 'password'>;
  }
}
