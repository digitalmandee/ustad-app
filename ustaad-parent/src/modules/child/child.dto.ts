export class CreateChildDto {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  grade: string;
  age: number;
  schoolName: string;
  // curriculum: string;
  image?: string;
}

export class UpdateChildDto extends CreateChildDto {
  id: string;
}

export class DeleteChildDto {
  id: string;
}
