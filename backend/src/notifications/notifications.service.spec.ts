import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationCategory } from './notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Model } from 'mongoose';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken('Notification'),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const dto: CreateNotificationDto = {
        header: 'Test Header',
        body: 'Test Body',
        category: NotificationCategory.INFO,
      };

      const expectedNotification = {
        ...dto,
        userId,
        _id: '507f1f77bcf86cd799439022',
        isClosed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the constructor and save method
      const mockSave = jest.fn().mockResolvedValue(expectedNotification);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));
      
      // Override the service's notificationModel with our mock constructor
      (service as any).notificationModel = mockConstructor;

      const result = await service.create(dto, userId);
      
      expect(mockConstructor).toHaveBeenCalledWith({
        header: 'Test Header',
        body: 'Test Body',
        category: NotificationCategory.INFO,
        userId: userId,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(expectedNotification);
    });
  });
});
