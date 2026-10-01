import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import ReviewClient from './review-client';

export default async function ReviewPage() { if (!(await getCurrentUserId())) redirect('/login'); return <ReviewClient />; }
