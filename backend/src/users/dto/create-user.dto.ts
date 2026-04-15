import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty()
  fullName: string;

  @IsString() @IsNotEmpty() @Matches(/^\S*$/, { message: 'username must not contain spaces' })
  username: string;

  @IsString() @MinLength(6)
  password: string;
}
