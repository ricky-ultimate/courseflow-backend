import { SetMetadata } from '@nestjs/common';

export const SKIP_COLLEGE_GUARD_KEY = 'skip_college_guard';
export const SkipCollegeGuard = () => SetMetadata(SKIP_COLLEGE_GUARD_KEY, true);
