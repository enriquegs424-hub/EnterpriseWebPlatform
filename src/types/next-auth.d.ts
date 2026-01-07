import { Role } from "@prisma/client"
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            role: Role
            id: string
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role: Role
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role: Role
        id: string
    }
}

declare module "@auth/core/adapters" {
    interface AdapterUser {
        role: Role
    }
}
