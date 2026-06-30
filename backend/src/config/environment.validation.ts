import { plainToInstance } from 'class-transformer';
import { IsBooleanString, IsNumberString, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString() NODE_ENV: string;
  @IsNumberString() PORT: string;
  @IsString() DB_HOST: string;
  @IsString() DB_USERNAME: string;
  @IsString() DB_DATABASE: string;
  @IsBooleanString() SWAGGER_ENABLED: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}
