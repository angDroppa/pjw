import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

//oggetto response
export const UserResponseSchema = z.object({
    user: z.object({
        id: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        roleName: z.string(), // ← allineato a Prisma
    }),
})

export type UserResponse = z.infer<typeof UserResponseSchema>