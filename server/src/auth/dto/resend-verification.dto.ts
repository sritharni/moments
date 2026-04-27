import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email!: string;
}
