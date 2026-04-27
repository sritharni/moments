import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email!: string;

  @IsString()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  code!: string;
}
