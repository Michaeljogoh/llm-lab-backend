import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { LlmService } from 'src/llm/llm.service';
import { parameters } from 'src/helpers/parameter-combination';
import { MetricsService } from 'src/metrics/metrics.service';
import { InjectModel } from '@nestjs/mongoose';
import { Experiment } from './schemas/experiment.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_SCORING_WEIGHTS,
  ScoringWeights,
} from './constants/scoring-weights';
import { SweepSuggestService } from './sweep-suggest.service';
import {
  BENCHMARK_DEFAULT_PARAMS,
  GOLDEN_BENCHMARK_PROMPTS,
} from './constants/benchmark-prompts';
import { PROMPT_PRESETS } from './constants/prompt-presets';
import { sleep } from 'src/helpers/retry';
import { randomUUID } from 'crypto';
import {
  RateResponseDto,
  ShareExperimentDto,
  UpdateTagsDto,
} from './dto/update-experiment.dto';

type RunItem = {
  temperature: number;
  topP: number;
  topK: number;
  maxToken: number;
  model: string;
};

@Injectable()
export class ExperimentService {
  private processing = new Set<string>();

  constructor(
    @InjectModel('Experiment') private experimentModel: Model<Experiment>,
    private llmService: LlmService,
    private metricsService: MetricsService,
    private configService: ConfigService,
    private sweepSuggestService: SweepSuggestService,
  ) {}

  async create(createExperimentDto: CreateExperimentDto) {
    const {
      prompt,
      systemPrompt = '',
      temperature,
      topP,
      topK,
      maxToken,
      tags = [],
      models,
      scoringWeights,
      enableJudge = false,
      parentExperimentId,
      benchmarkSuiteId,
    } = createExperimentDto;

    const defaultModel =
      this.configService.get<string>('geminiModel') ?? 'gemini-2.0-flash-001';
    const modelList = models?.length ? models : [defaultModel];
    const paramCombos = parameters(temperature, topP, topK, maxToken);
    const total = paramCombos.length * modelList.length;

    const experiment = await this.experimentModel.create({
      title: prompt.slice(0, 120),
      prompt,
      systemPrompt,
      tags,
      responses: [],
      status: 'queued',
      progress: { completed: 0, total, failed: 0 },
      models: modelList,
      runConfig: { temperature, topP, topK, maxToken },
      scoringWeights: { ...DEFAULT_SCORING_WEIGHTS, ...scoringWeights },
      enableJudge,
      isPublic: false,
      parentExperimentId,
      benchmarkSuiteId,
    });

    void this.processExperiment(experiment._id.toString());
    return experiment;
  }

  async processExperiment(id: string) {
    if (this.processing.has(id)) return;
    this.processing.add(id);

    try {
      const experiment = await this.experimentModel.findById(id);
      if (!experiment) return;

      await this.experimentModel.updateOne(
        { _id: id },
        { status: 'running' },
      );

      const runList = this.buildRunList(experiment);
      const weights = experiment.scoringWeights as ScoringWeights;
      let completed = experiment.progress?.completed ?? 0;

      for (let i = completed; i < runList.length; i++) {
        const item = runList[i];
        try {
          const result = await this.llmService.llmResponse({
            prompt: experiment.prompt,
            systemPrompt: experiment.systemPrompt,
            temperature: item.temperature,
            topP: item.topP,
            topK: item.topK,
            maxToken: item.maxToken,
            model: item.model,
          });

          const metrics = this.metricsService.qualityMetrics(
            experiment.prompt,
            result.text,
          );
          const score = this.metricsService.weightedScore(metrics, weights);

          const responseDoc: Record<string, unknown> = {
            parameters: {
              temperature: item.temperature,
              topP: item.topP,
              topK: item.topK,
              maxToken: item.maxToken,
            },
            response: result.text,
            metrics: { ...metrics, qualityScore: score },
            score,
            model: result.model,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            estimatedCostUsd: result.estimatedCostUsd,
          };

          if (experiment.enableJudge) {
            const judge = await this.llmService.judgeResponse(
              experiment.prompt,
              result.text,
              experiment.systemPrompt,
              item.model,
            );
            responseDoc.judgeScore = judge.score;
            responseDoc.judgeRationale = judge.rationale;
          }

          await this.experimentModel.updateOne(
            { _id: id },
            {
              $push: { responses: responseDoc },
              $set: { 'progress.completed': i + 1 },
            },
          );

          completed = i + 1;
          await sleep(400);
        } catch {
          await this.experimentModel.updateOne(
            { _id: id },
            { $inc: { 'progress.failed': 1 }, $set: { 'progress.completed': i + 1 } },
          );
          completed = i + 1;
        }
      }

      const updated = await this.experimentModel.findById(id);
      if (updated) {
        const suggestion = this.sweepSuggestService.suggestNextSweep(
          updated.responses,
          updated.runConfig,
        );
        await this.experimentModel.updateOne(
          { _id: id },
          {
            status: 'completed',
            suggestedNextSweep: suggestion,
          },
        );
      }
    } finally {
      this.processing.delete(id);
    }
  }

  private buildRunList(experiment: Experiment): RunItem[] {
    const cfg = experiment.runConfig;
    const combos = parameters(
      cfg.temperature,
      cfg.topP,
      cfg.topK,
      cfg.maxToken,
    );
    const models = experiment.models?.length
      ? experiment.models
      : [this.configService.get<string>('geminiModel') ?? 'gemini-2.0-flash-001'];

    const list: RunItem[] = [];
    for (const model of models) {
      for (const combo of combos) {
        list.push({ ...combo, model });
      }
    }
    return list;
  }

  async findAll() {
    return this.experimentModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const exp = await this.experimentModel.findById(id);
    if (!exp) throw new NotFoundException('Experiment not found');
    return exp;
  }

  async getStatus(id: string) {
    const exp = await this.findOne(id);
    return {
      id: exp._id,
      status: exp.status,
      progress: exp.progress,
    };
  }

  async findByShareToken(token: string) {
    const exp = await this.experimentModel.findOne({
      shareToken: token,
      isPublic: true,
    });
    if (!exp) throw new NotFoundException('Shared experiment not found');
    return exp;
  }

  async resume(id: string) {
    const exp = await this.findOne(id);
    if (exp.status === 'running') return exp;
    if (exp.progress.completed >= exp.progress.total) {
      throw new BadRequestException('Experiment already complete');
    }
    void this.processExperiment(id);
    return this.experimentModel.findById(id);
  }

  async duplicate(id: string) {
    const source = await this.findOne(id);
    return this.create({
      prompt: source.prompt,
      systemPrompt: source.systemPrompt,
      temperature: source.runConfig.temperature,
      topP: source.runConfig.topP,
      topK: source.runConfig.topK,
      maxToken: source.runConfig.maxToken,
      tags: source.tags,
      models: source.models,
      scoringWeights: source.scoringWeights as ScoringWeights,
      enableJudge: source.enableJudge,
      parentExperimentId: source._id.toString(),
    });
  }

  async narrowSweep(id: string) {
    const source = await this.findOne(id);
    const suggestion =
      source.suggestedNextSweep ??
      this.sweepSuggestService.suggestNextSweep(
        source.responses,
        source.runConfig,
      );

    return this.create({
      prompt: source.prompt,
      systemPrompt: source.systemPrompt,
      temperature: suggestion.runConfig.temperature,
      topP: suggestion.runConfig.topP,
      topK: suggestion.runConfig.topK,
      maxToken: suggestion.runConfig.maxToken,
      tags: [...(source.tags ?? []), 'narrow-sweep'],
      models: source.models,
      scoringWeights: source.scoringWeights as ScoringWeights,
      enableJudge: source.enableJudge,
      parentExperimentId: source._id.toString(),
    });
  }

  async runJudge(id: string) {
    const experiment = await this.findOne(id);
    const responses = [...experiment.responses];

    for (let i = 0; i < responses.length; i++) {
      const row = responses[i];
      const judge = await this.llmService.judgeResponse(
        experiment.prompt,
        row.response,
        experiment.systemPrompt,
        row.model,
      );
      responses[i] = {
        ...row,
        judgeScore: judge.score,
        judgeRationale: judge.rationale,
      } as typeof row;
    }

    experiment.responses = responses;
    await experiment.save();
    return experiment;
  }

  async regressionCheck(id: string) {
    const baseline = await this.findOne(id);
    const baselineScore = this.bestScore(baseline.responses);

    const rerun = await this.create({
      prompt: baseline.prompt,
      systemPrompt: baseline.systemPrompt,
      temperature: baseline.runConfig.temperature,
      topP: baseline.runConfig.topP,
      topK: baseline.runConfig.topK,
      maxToken: baseline.runConfig.maxToken,
      tags: [...(baseline.tags ?? []), 'regression'],
      models: baseline.models,
      scoringWeights: baseline.scoringWeights as ScoringWeights,
      enableJudge: baseline.enableJudge,
      parentExperimentId: baseline._id.toString(),
    });

    await this.waitForCompletion(rerun._id.toString());
    const completed = await this.findOne(rerun._id.toString());
    const newScore = this.bestScore(completed.responses);
    const delta = +(newScore - baselineScore).toFixed(3);

    completed.regressionResult = {
      baselineScore,
      newScore,
      delta,
      passed: newScore >= baselineScore - 0.05,
      baselineExperimentId: baseline._id.toString(),
    };
    await completed.save();
    return completed;
  }

  private async waitForCompletion(id: string, maxWaitMs = 300000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const exp = await this.experimentModel.findById(id);
      if (!exp) return;
      if (exp.status === 'completed' || exp.status === 'failed') return;
      await sleep(2000);
    }
  }

  private bestScore(responses: { score: number }[]) {
    if (!responses.length) return 0;
    return Math.max(...responses.map((r) => r.score));
  }

  async runBenchmark() {
    const suiteId = randomUUID();
    const created: Experiment[] = [];

    for (const bench of GOLDEN_BENCHMARK_PROMPTS) {
      const exp = await this.create({
        prompt: bench.prompt,
        systemPrompt: bench.systemPrompt,
        ...BENCHMARK_DEFAULT_PARAMS,
        tags: ['benchmark', bench.id],
        benchmarkSuiteId: suiteId,
      });
      created.push(exp);
    }

    return { suiteId, experiments: created };
  }

  getPresets() {
    return PROMPT_PRESETS;
  }

  getHeatmap(id: string) {
    const exp = this.findOne(id);
    return exp.then((e) =>
      this.sweepSuggestService.buildHeatmapData(e.responses),
    );
  }

  getSuggestSweep(id: string) {
    return this.findOne(id).then((exp) =>
      exp.suggestedNextSweep ??
      this.sweepSuggestService.suggestNextSweep(
        exp.responses,
        exp.runConfig,
      ),
    );
  }

  async updateShare(id: string, dto: ShareExperimentDto) {
    const exp = await this.findOne(id);
    const update: Record<string, unknown> = { isPublic: dto.isPublic };
    if (dto.isPublic && !exp.shareToken) {
      update.shareToken = randomUUID();
    }
    if (!dto.isPublic) {
      update.shareToken = null;
    }
    return this.experimentModel.findByIdAndUpdate(id, update, { new: true });
  }

  async updateTags(id: string, dto: UpdateTagsDto) {
    return this.experimentModel.findByIdAndUpdate(
      id,
      { tags: dto.tags },
      { new: true },
    );
  }

  async rateResponse(id: string, index: number, dto: RateResponseDto) {
    const exp = await this.findOne(id);
    if (index < 0 || index >= exp.responses.length) {
      throw new BadRequestException('Invalid response index');
    }
    exp.responses[index].humanRating = dto.rating;
    await exp.save();
    return exp;
  }

  async exportJson(id: string) {
    return this.findOne(id);
  }

  async remove(id: string) {
    return this.experimentModel.findByIdAndDelete(id);
  }
}
