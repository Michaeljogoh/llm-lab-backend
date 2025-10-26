import { IsString, IsArray, IsNotEmpty, IsNumber, isString } from "class-validator"

export class CreateExperimentDto {
    @IsNotEmpty()
    @IsString()
    prompt: string;
    
    @IsNotEmpty()
    @IsArray()
    temperature: number[];
    
    @IsNotEmpty()
    @IsArray()
    topP: number[];

    @IsNotEmpty()
    @IsArray()
    topK: number[];

    @IsNotEmpty()
    @IsArray()
    maxToken: number[];
}
