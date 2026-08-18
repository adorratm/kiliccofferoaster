import { Module } from '@nestjs/common';
import { ReviewsController } from '@modules/reviews/reviews.controller';
import { ReviewsService } from '@modules/reviews/reviews.service';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
