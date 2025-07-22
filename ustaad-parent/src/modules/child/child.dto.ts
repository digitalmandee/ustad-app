export class CreateChildDto {
  fullName: string;
  gender: 'male' | 'female';
  grade: string;
  age: number;
  schoolName: string;
  image?: string;
}

export class UpdateChildDto extends CreateChildDto {
  id: string;
}

export class DeleteChildDto {
  id: string;
} 