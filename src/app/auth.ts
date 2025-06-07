export type UserRole = 'user' | 'seller' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export const ADMIN_EMAIL = 'topcitytickets@gmail.com'
export const ADMIN_ID = '5d2f1227-7db9-4e4f-a033-f29156e6cd3a'
