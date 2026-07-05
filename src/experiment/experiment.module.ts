import { Module } from '@nestjs/common';
import { ExperimentService } from './experiment.service';
import { ExperimentController } from './experiment.controller';
import { LlmService } from 'src/llm/llm.service';
import { MetricsService } from 'src/metrics/metrics.service';
import { SweepSuggestService } from './sweep-suggest.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ExperimentSchema } from './schemas/experiment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Experiment', schema: ExperimentSchema },
    ]),
  ],
  controllers: [ExperimentController],
  providers: [ExperimentService, LlmService, MetricsService, SweepSuggestService],
  exports: [ExperimentService],
})
export class ExperimentModule {}
