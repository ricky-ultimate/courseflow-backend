import { SetMetadata } from '@nestjs/common';

export const SKIP_HOD_GUARD_KEY = 'skip_hod_guard';
export const SkipHodGuard = () => SetMetadata(SKIP_HOD_GUARD_KEY, true);
