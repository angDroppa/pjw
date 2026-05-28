import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { UserSchema, CreateUserSchema } from './schemas/user.schema'
import { RegisterSchema, LoginSchema, LoginResponseSchema } from './schemas/auth.schema'
import { z } from 'zod'

const registry = new OpenAPIRegistry()

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
})

registry.register('User', UserSchema)
registry.register('Register', RegisterSchema)
registry.register('Login', LoginSchema)

// Register
registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    summary: 'Registra un nuovo utente',
    request: {
        body: {
            content: { 'application/json': { schema: RegisterSchema } },
        },
    },
    responses: {
        201: { description: 'Utente registrato' },
        400: { description: 'Dati non validi' },
        409: { description: 'Email già esistente' },
    },
})

// Login
registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    summary: 'Login e ottieni JWT',
    request: {
        body: {
            content: { 'application/json': { schema: LoginSchema } },
        },
    },
    responses: {
        200: {
            description: 'Login riuscito',
            content: { 'application/json': { schema: LoginResponseSchema } },
        },
        401: { description: 'Credenziali non valide' },
    },
})

// Refresh
registry.registerPath({
    method: 'post',
    path: '/api/auth/refresh',
    summary: 'Ottieni nuovo access token (con refresh token rotation)',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Nuovi token (rotation)',
            content: {
                'application/json': {
                    schema: LoginResponseSchema, // ← stessa shape di /login: accessToken + refreshToken + user
                },
            },
        },
        401: { description: 'Refresh token non valido o scaduto' },
    },
})

// Logout
registry.registerPath({
    method: 'post',
    path: '/api/auth/logout',
    summary: 'Logout e invalida refresh token',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
                    }),
                },
            },
        },
    },
    responses: {
        200: { description: 'Logout effettuato' },
        400: { description: 'Refresh token mancante' },
    },
})

// Users
registry.registerPath({
    method: 'get',
    path: '/api/users',
    summary: 'Lista tutti gli utenti',
    security: [{ [bearerAuth.name]: [] }],
    responses: {
        200: {
            description: 'Lista utenti',
            content: { 'application/json': { schema: z.array(UserSchema) } },
        },
        401: { description: 'Non autorizzato' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/users',
    summary: 'Crea un utente',
    security: [{ [bearerAuth.name]: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: CreateUserSchema } },
        },
    },
    responses: {
        201: {
            description: 'Utente creato',
            content: { 'application/json': { schema: UserSchema } },
        },
        400: { description: 'Dati non validi' },
        401: { description: 'Non autorizzato' },
    },
})



export function getApiDocs() {
    const generator = new OpenApiGeneratorV3(registry.definitions)
    return generator.generateDocument({
        openapi: '3.0.0',
        info: { title: 'My API', version: '1.0.0' },
        servers: [{ url: 'http://localhost:3000' }],
    })
}