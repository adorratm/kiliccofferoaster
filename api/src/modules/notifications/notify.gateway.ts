import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { Public } from '@common/decorators/public.decorator';
import { User } from '@entities/user.entity';
import { InAppNotification } from '@entities/in-app-notification.entity';

@Public()
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/notify',
  transports: ['polling'],
})
export class NotifyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotifyGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @InjectEntityManager() private readonly em: EntityManager,
  ) {}

  async handleConnection(client: Socket) {
    const token = this.readToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret:
          this.config.get<string>('jwt.secret') || 'change-me-in-production',
      });
      const user = await this.em.findOne(User, {
        where: { id: payload.sub, isActive: true },
      });
      if (!user) {
        client.disconnect(true);
        return;
      }
      client.data.userId = user.id;
      await client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`notify disconnect ${client.id}`);
  }

  emitToUser(userId: string, row: InAppNotification) {
    this.server?.to(`user:${userId}`).emit('notify:new', {
      id: row.id,
      title: row.title,
      body: row.body,
      href: row.href,
      type: row.type,
      category: row.category,
      audience: row.audience,
      orderId: row.orderId,
      readAt: row.readAt,
      createdAt: row.createdAt,
    });
  }

  private readToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: unknown } | undefined;
    if (typeof auth?.token === 'string' && auth.token) return auth.token;
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    const q = client.handshake.query.token;
    if (typeof q === 'string' && q) return q;
    return null;
  }
}
