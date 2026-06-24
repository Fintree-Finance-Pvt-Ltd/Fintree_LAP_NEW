import { IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkflowLogAction } from '../../../common/enums/workflow-log-action.enum';

export class WorkflowStepDto {
  @IsString()
  action: WorkflowLogAction | string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
