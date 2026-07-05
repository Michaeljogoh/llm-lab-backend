import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ExperimentService } from './experiment.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import {
  RateResponseDto,
  ShareExperimentDto,
  UpdateTagsDto,
} from './dto/update-experiment.dto';

@Controller('experiment')
export class ExperimentController {
  constructor(private readonly experimentService: ExperimentService) {}

  @Get('presets')
  getPresets() {
    return this.experimentService.getPresets();
  }

  @Post('benchmark')
  runBenchmark() {
    return this.experimentService.runBenchmark();
  }

  @Get('share/:token')
  findByShare(@Param('token') token: string) {
    return this.experimentService.findByShareToken(token);
  }

  @Post()
  create(@Body() createExperimentDto: CreateExperimentDto) {
    return this.experimentService.create(createExperimentDto);
  }

  @Get()
  findAll() {
    return this.experimentService.findAll();
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.experimentService.getStatus(id);
  }

  @Get(':id/heatmap')
  getHeatmap(@Param('id') id: string) {
    return this.experimentService.getHeatmap(id);
  }

  @Get(':id/suggest-sweep')
  getSuggestSweep(@Param('id') id: string) {
    return this.experimentService.getSuggestSweep(id);
  }

  @Get(':id/export/json')
  exportJson(@Param('id') id: string) {
    return this.experimentService.exportJson(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.experimentService.resume(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.experimentService.duplicate(id);
  }

  @Post(':id/narrow-sweep')
  narrowSweep(@Param('id') id: string) {
    return this.experimentService.narrowSweep(id);
  }

  @Post(':id/judge')
  runJudge(@Param('id') id: string) {
    return this.experimentService.runJudge(id);
  }

  @Post(':id/regression')
  regressionCheck(@Param('id') id: string) {
    return this.experimentService.regressionCheck(id);
  }

  @Patch(':id/share')
  updateShare(@Param('id') id: string, @Body() dto: ShareExperimentDto) {
    return this.experimentService.updateShare(id, dto);
  }

  @Patch(':id/tags')
  updateTags(@Param('id') id: string, @Body() dto: UpdateTagsDto) {
    return this.experimentService.updateTags(id, dto);
  }

  @Patch(':id/responses/:index/rate')
  rateResponse(
    @Param('id') id: string,
    @Param('index') index: string,
    @Body() dto: RateResponseDto,
  ) {
    return this.experimentService.rateResponse(id, parseInt(index, 10), dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.experimentService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.experimentService.remove(id);
  }
}
