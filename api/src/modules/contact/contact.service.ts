import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ContactMessage } from '@entities/contact-message.entity';
import { NewsletterSubscriber } from '@entities/newsletter-subscriber.entity';
import {
  CreateContactMessageDto,
  MarkContactReadDto,
  NewsletterSubscribeDto,
} from '@modules/contact/dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async createMessage(dto: CreateContactMessageDto): Promise<ContactMessage> {
    const msg = this.em.create(ContactMessage, {
      senderName: dto.senderName,
      senderEmail: dto.senderEmail.toLowerCase().trim(),
      protocolType: dto.protocolType,
      message: dto.message,
      isRead: false,
    });
    return this.em.save(msg);
  }

  async listMessages(): Promise<ContactMessage[]> {
    return this.em.find(ContactMessage, {
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(
    id: string,
    dto: MarkContactReadDto,
  ): Promise<ContactMessage> {
    const msg = await this.em.findOne(ContactMessage, { where: { id } });
    if (!msg) {
      throw new NotFoundException('Mesaj bulunamadı');
    }
    msg.isRead = dto.isRead ?? true;
    return this.em.save(msg);
  }

  async subscribeNewsletter(
    dto: NewsletterSubscribeDto,
  ): Promise<NewsletterSubscriber> {
    const email = dto.email.toLowerCase().trim();
    let sub = await this.em.findOne(NewsletterSubscriber, { where: { email } });
    if (sub) {
      sub.isActive = true;
      if (dto.source) sub.source = dto.source;
      return this.em.save(sub);
    }
    sub = this.em.create(NewsletterSubscriber, {
      email,
      isActive: true,
      source: dto.source ?? 'website',
    });
    return this.em.save(sub);
  }

  async listSubscribers(): Promise<NewsletterSubscriber[]> {
    return this.em.find(NewsletterSubscriber, {
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
