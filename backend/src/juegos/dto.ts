import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class NombreDto {
  @IsString({ message: 'el nombre debe ser texto' })
  @IsNotEmpty({ message: 'falta el nombre' })
  @MinLength(2, { message: 'el nombre es muy corto' })
  @MaxLength(20, { message: 'el nombre es muy largo' })
  @Matches(/^[A-Za-z0-9 ]+$/, { message: 'el nombre solo puede tener letras y numeros' })
  nombre: string;
}

export class NumeroDto extends NombreDto {
  @IsString({ message: 'el numero se envia como texto' })
  @IsNotEmpty({ message: 'falta el numero' })
  numero: string;
}
