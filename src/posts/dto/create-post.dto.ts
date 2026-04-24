import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}
