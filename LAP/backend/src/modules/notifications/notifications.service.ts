import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { Actor } from '../applications/applications.service';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private readonly notifications: Repository<Notification>) {}

  async findMine(actor: Actor) {
    return { data: await this.notifications.find({ where: [{ userId: actor.id }, { userId: IsNull() }], order: { id: 'DESC' }, take: 100 }) };
  }

  async markRead(id: number, actor: Actor) {
    const notification = await this.notifications.findOne({ where: { id } });
    if (!notification || (notification.userId && notification.userId !== actor.id)) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return { data: await this.notifications.save(notification) };
  }
}
