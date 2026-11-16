import swaggerUi from 'swagger-ui-express';

const dataResponse = (description, schema) => ({
    description,
    content: { 'application/json': { schema: { type: 'object', required: ['success', 'data'], properties: { success: { type: 'boolean', const: true }, data: schema } } } }
});
const listResponse = (description, itemSchema) => dataResponse(description, { type: 'array', items: itemSchema });

export const swaggerDocument = {
    openapi: '3.1.0',
    info: {
        title: 'FactoryFlow API',
        version: '1.0.0',
        description: 'Documentation officielle de l’API FactoryFlow - Gestion de production industrielle à Safi.'
    },
    servers: [
        {
            url: 'http://localhost:3000/api',
            description: 'Serveur de Développement'
        }
    ],
    paths: {
        '/installation/status': {
            get: {
                summary: 'Vérifier l’état d’installation de l’application',
                responses: { '200': { description: 'État récupéré avec succès', content: { 'application/json': { schema: { type: 'object', required: ['isInstalled'], properties: { isInstalled: { type: 'boolean' } } } } } } }
            }
        },
        '/installation': {
            post: {
                summary: 'Initialiser l’application et créer le premier Admin',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', minLength: 1 },
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string', minLength: 8 }
                                },
                                required: ['name', 'email', 'password']
                            }
                        }
                    }
                },
                responses: { '201': { description: 'Application installée avec succès', content: { 'application/json': { schema: { type: 'object', required: ['success', 'user'], properties: { success: { type: 'boolean' }, message: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } }, '400': { $ref: '#/components/responses/Error' }, '409': { $ref: '#/components/responses/Error' } }
            }
        },
        '/auth/login': {
            post: {
                summary: 'Connexion utilisateur et obtention du token JWT',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
                responses: { '200': { description: 'Connexion réussie', content: { 'application/json': { schema: { type: 'object', required: ['success', 'token', 'user'], properties: { success: { type: 'boolean' }, message: { type: 'string' }, token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } }, '401': { $ref: '#/components/responses/Error' } }
            }
        },
        '/auth/profile': { get: { summary: 'Consulter son profil', security: [{ bearerAuth: [] }], responses: { '200': dataResponse('Profil courant', { $ref: '#/components/schemas/User' }), '401': { $ref: '#/components/responses/Error' } } } },
        '/auth/users/operators': {
            get: { summary: 'Lister les opérateurs (Admin)', security: [{ bearerAuth: [] }], responses: { '200': listResponse('Liste des opérateurs', { $ref: '#/components/schemas/User' }) } },
            post: { summary: 'Créer un opérateur (Admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } } }, responses: { '201': { description: 'Opérateur créé' } } }
        },
        '/auth/users/admins': { post: { summary: 'Créer un autre Admin', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserInput' } } } }, responses: { '201': { description: 'Admin créé' } } } },
        '/matierPr': {
            get: { summary: 'Lister les matières premières', security: [{ bearerAuth: [] }], responses: { '200': listResponse('Liste des matières', { $ref: '#/components/schemas/Material' }) } },
            post: { summary: 'Créer une matière (Admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MaterialInput' } } } }, responses: { '201': dataResponse('Matière créée', { $ref: '#/components/schemas/Material' }) } }
        },
        '/matierPr/{id}': {
            get: { summary: 'Consulter une matière', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': dataResponse('Matière trouvée', { $ref: '#/components/schemas/Material' }), '404': { $ref: '#/components/responses/Error' } } },
            put: { summary: 'Modifier une matière (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/MaterialUpdate' } } } }, responses: { '200': dataResponse('Matière modifiée', { $ref: '#/components/schemas/Material' }) } },
            delete: { summary: 'Supprimer une matière (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': { description: 'Matière supprimée' } } }
        },
        '/matierPr/{id}/stock': { post: { summary: 'Enregistrer une entrée de stock (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['quantity'], properties: { quantity: { type: 'number', exclusiveMinimum: 0 } } } } } }, responses: { '200': dataResponse('Stock et mouvement enregistrés', { $ref: '#/components/schemas/Material' }) } } },
        '/matierPr/alerts': { get: { summary: 'Lister les matières sous leur seuil', security: [{ bearerAuth: [] }], responses: { '200': listResponse('Matières en alerte', { $ref: '#/components/schemas/Material' }) } } },
        '/matierPr/movements': { get: { summary: 'Consulter les mouvements de stock (Admin)', security: [{ bearerAuth: [] }], parameters: [{ name: 'rawMaterial', in: 'query', schema: { type: 'string', format: 'mongo object id' } }, { name: 'type', in: 'query', schema: { type: 'string', enum: ['ENTRY', 'EXIT'] } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 100 } }], responses: { '200': listResponse('Historique des mouvements', { $ref: '#/components/schemas/StockMovement' }) } } },
        '/products': {
            get: { summary: 'Lister les produits', security: [{ bearerAuth: [] }], responses: { '200': listResponse('Liste des produits', { $ref: '#/components/schemas/Product' }) } },
            post: { summary: 'Créer un produit et sa composition (Admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } } }, responses: { '201': dataResponse('Produit créé', { $ref: '#/components/schemas/Product' }) } }
        },
        '/products/{id}': {
            get: { summary: 'Consulter un produit', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': dataResponse('Produit trouvé', { $ref: '#/components/schemas/Product' }) } },
            put: { summary: 'Modifier un produit (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductUpdate' } } } }, responses: { '200': dataResponse('Produit modifié', { $ref: '#/components/schemas/Product' }) } },
            delete: { summary: 'Supprimer un produit (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': { description: 'Produit supprimé' } } }
        },
        '/orders': {
            get: { summary: 'Lister les ordres avec filtres et pagination (ordres affectés pour un opérateur)', security: [{ bearerAuth: [] }], parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['PLANIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] } }, { name: 'product', in: 'query', schema: { type: 'string' } }, { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } }], responses: { '200': { description: 'Page d’ordres', content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderPage' } } } } } },
            post: { summary: 'Créer un ordre planifié (Admin)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderInput' } } } }, responses: { '201': dataResponse('Ordre créé avec copie de la composition', { $ref: '#/components/schemas/Order' }) } }
        },
        '/orders/mine': { get: { summary: 'Lister les ordres affectés à l’opérateur', security: [{ bearerAuth: [] }], responses: { '200': listResponse('Ordres affectés', { $ref: '#/components/schemas/Order' }) } } },
        '/orders/history': { get: { summary: 'Historique des ordres terminés de l’opérateur', security: [{ bearerAuth: [] }], responses: { '200': listResponse('Ordres terminés', { $ref: '#/components/schemas/Order' }) } } },
        '/orders/{id}': {
            get: { summary: 'Consulter un ordre autorisé', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': dataResponse('Ordre trouvé', { $ref: '#/components/schemas/Order' }), '403': { $ref: '#/components/responses/Error' } } },
            put: { summary: 'Modifier un ordre planifié (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderUpdate' } } } }, responses: { '200': dataResponse('Ordre modifié', { $ref: '#/components/schemas/Order' }) } }
        },
        '/orders/{id}/cancel': { patch: { summary: 'Annuler un ordre planifié (Admin)', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': { description: 'Ordre annulé' } } } },
        '/orders/{id}/start': { post: { summary: 'Démarrer un ordre et déduire les composants en transaction', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': dataResponse('Ordre démarré', { $ref: '#/components/schemas/Order' }), '403': { $ref: '#/components/responses/Error' }, '409': { $ref: '#/components/responses/Error' } } } },
        '/orders/{id}/complete': { post: { summary: 'Terminer un ordre en cours', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/id' }], responses: { '200': dataResponse('Ordre terminé et stock produit mis à jour', { $ref: '#/components/schemas/Order' }) } } }
    },
    components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
        responses: { Error: { description: 'Erreur de validation ou accès', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } },
        parameters: { id: { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'mongo object id' } } },
        schemas: {
            UserInput: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 1 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 } } },
            User: { type: 'object', required: ['_id', 'name', 'email', 'role'], properties: { _id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, role: { type: 'string', enum: ['ADMIN', 'OPERATOR'] } } },
            MaterialInput: { type: 'object', required: ['name', 'referance', 'unit'], properties: { name: { type: 'string', minLength: 1 }, referance: { type: 'string', minLength: 1 }, unit: { type: 'string', minLength: 1 }, stockQuantity: { type: 'number', minimum: 0, default: 0 }, alertThreshold: { type: 'number', minimum: 0, default: 0 } } },
            MaterialUpdate: { type: 'object', properties: { name: { type: 'string', minLength: 1 }, referance: { type: 'string', minLength: 1 }, unit: { type: 'string', minLength: 1 }, alertThreshold: { type: 'number', minimum: 0 } } },
            CompositionLine: { type: 'object', required: ['rawMaterial', 'quantityRequired'], properties: { rawMaterial: { type: 'string', format: 'mongo object id' }, quantityRequired: { type: 'number', exclusiveMinimum: 0 } } },
            ProductInput: { type: 'object', required: ['name', 'reference', 'composition'], properties: { name: { type: 'string', minLength: 1 }, reference: { type: 'string', minLength: 1 }, price: { type: 'number', minimum: 0, default: 0 }, composition: { type: 'array', minItems: 1, description: 'Chaque rawMaterial ne peut apparaître qu’une fois.', items: { $ref: '#/components/schemas/CompositionLine' } } } },
            ProductUpdate: { type: 'object', properties: { name: { type: 'string', minLength: 1 }, reference: { type: 'string', minLength: 1 }, price: { type: 'number', minimum: 0 }, composition: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/CompositionLine' } } } },
            OrderInput: { type: 'object', required: ['product', 'operator', 'quantityToProduce', 'plannedDate'], properties: { reference: { type: 'string' }, product: { type: 'string', format: 'mongo object id' }, operator: { type: 'string', format: 'mongo object id' }, quantityToProduce: { type: 'number', exclusiveMinimum: 0 }, plannedDate: { type: 'string', format: 'date-time' } } },
            OrderUpdate: { type: 'object', properties: { reference: { type: 'string' }, operator: { type: 'string', format: 'mongo object id' }, quantityToProduce: { type: 'number', exclusiveMinimum: 0 }, plannedDate: { type: 'string', format: 'date-time' } } },
            Material: { type: 'object', required: ['_id', 'name', 'referance', 'unit', 'stockQuantity', 'alertThreshold'], properties: { _id: { type: 'string' }, name: { type: 'string' }, referance: { type: 'string' }, unit: { type: 'string' }, stockQuantity: { type: 'number' }, alertThreshold: { type: 'number' } } },
            Product: { type: 'object', required: ['_id', 'name', 'reference', 'composition', 'stockQuantity'], properties: { _id: { type: 'string' }, name: { type: 'string' }, reference: { type: 'string' }, composition: { type: 'array', items: { type: 'object', required: ['rawMaterial', 'quantityRequired'], properties: { rawMaterial: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Material' }] }, quantityRequired: { type: 'number', exclusiveMinimum: 0 } } } }, stockQuantity: { type: 'number' } } },
            Order: { type: 'object', required: ['_id', 'reference', 'product', 'operator', 'quantityToProduce', 'status', 'compositionSnapshot'], properties: { _id: { type: 'string' }, reference: { type: 'string' }, product: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Product' }] }, operator: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] }, quantityToProduce: { type: 'number', exclusiveMinimum: 0 }, status: { type: 'string', enum: ['PLANIFIED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }, compositionSnapshot: { type: 'array', items: { type: 'object', required: ['rawMaterial', 'quantityRequiredPerUnit'], properties: { rawMaterial: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Material' }] }, quantityRequiredPerUnit: { type: 'number', exclusiveMinimum: 0 } } } }, plannedDate: { type: 'string', format: 'date-time' }, startDate: { type: 'string', format: 'date-time' }, endDate: { type: 'string', format: 'date-time' } } },
            StockMovement: { type: 'object', required: ['_id', 'rawMaterial', 'type', 'quantity', 'user'], properties: { _id: { type: 'string' }, rawMaterial: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Material' }] }, type: { type: 'string', enum: ['ENTRY', 'EXIT'] }, quantity: { type: 'number', exclusiveMinimum: 0 }, user: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/User' }] }, order: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Order' }] }, createdAt: { type: 'string', format: 'date-time' } } },
            OrderPage: { type: 'object', required: ['success', 'total', 'page', 'totalPages', 'data'], properties: { success: { type: 'boolean', const: true }, total: { type: 'integer' }, page: { type: 'integer' }, totalPages: { type: 'integer' }, data: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } },
            ApiResponse: { type: 'object', required: ['success'], properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: {} } },
            ErrorResponse: { type: 'object', required: ['success', 'message'], properties: { success: { const: false }, message: { type: 'string' } } }
        }
    }
};

export function setupSwagger(app) {
    app.get('/api-docs.json', (req, res) => res.json(swaggerDocument));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
