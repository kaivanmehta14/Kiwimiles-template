import { IsNotEmpty } from "class-validator";

export class UpdateTimingDto {

    @IsNotEmpty()
    taskName!: string;

    @IsNotEmpty()
    timing!: string;
  }