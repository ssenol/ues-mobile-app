import type { transformTaskToAssignment } from '../utils/assignmentTransform';

// transformTaskToAssignment çıktısı; assignmentTransform TS'e geçince orada açıkça tanımlanacak
export type Assignment = NonNullable<ReturnType<typeof transformTaskToAssignment>>;
