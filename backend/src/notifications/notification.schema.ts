import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationCategory {
  INFO = 'INFO', WARNING = 'WARNING', ERROR = 'ERROR',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true }) header: string;
  @Prop({ required: true }) body: string;
  @Prop({ required: true, enum: NotificationCategory }) category: NotificationCategory;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ default: false }) isClosed: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
