import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

// Fallback prevents startup crash when env vars are not yet configured.
// All actual requests to Supabase will fail at runtime with a clear error.
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'
)

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  req.userId = user.id
  next()
}
