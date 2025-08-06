// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next (Next.js internals)
     * - static files (with extension)
     */
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
