import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { NotificationCategory } from '../notification.schema';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  header: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(NotificationCategory)
  category: NotificationCategory;
}
