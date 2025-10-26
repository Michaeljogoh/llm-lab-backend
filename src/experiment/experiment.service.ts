import { Injectable } from '@nestjs/common';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { LlmService } from 'src/llm/llm.service';
import { parameters } from 'src/helpers/parameter-combination';
import { MetricsService } from 'src/metrics/metrics.service';
import { Exper } from './interface/experiment.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Experiment } from './schemas/experiment.schema';
import { Model } from 'mongoose';


@Injectable()
export class ExperimentService {

  constructor(@InjectModel('Experiment') private experimentModel:Model<Experiment>, private llmService: LlmService, private metricsService:MetricsService){}

  async create(createExperimentDto: CreateExperimentDto) {

     const { prompt, temperature, topP, topK, maxToken } = createExperimentDto;
     
     const params = parameters(temperature, topP, topK, maxToken);
      
     const responses: Exper[] = [];  

     for(const { temperature, topP, topK, maxToken } of params){

        const response = await this.llmService.llmResponse({ prompt, temperature, topP, topK, maxToken });
        const metrics = this.metricsService.qualityMetrics(prompt, response);
        const parameters = { temperature, topP, topK, maxToken };
        const score = this.metricsService.qualityScore(prompt, response)
        responses.push({ parameters, response, metrics, score })
     };


    return await this.experimentModel.create({ 
     title: prompt,
     prompt: prompt,
     responses: responses,
     });

  }

  async findAll(): Promise<Exper[]> {
    return this.experimentModel.find();
  }

  findOne(id: string) {
    return this.experimentModel.findById(id)
  }

  export(id: string){
    const exper =  this.experimentModel.findById(id)
  }

  async remove(id: string) {
    return  await this.experimentModel.findByIdAndDelete(id)    
  }
}
