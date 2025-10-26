import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExperimentService } from './experiment.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('experiment')
export class ExperimentController {
  constructor(private readonly experimentService: ExperimentService) {}

  @Post()
  create(@Body() createExperimentDto: CreateExperimentDto) {
    return this.experimentService.create(createExperimentDto);
  }

  @Get()
  findAll() {
    return this.experimentService.findAll();
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
