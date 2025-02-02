const { expect } = require("chai");
const combineNodes = require("../src/combine-nodes.js");
const GraphQLNode = require("../src/graphql-node.js");
const IdioEnum = require("../src/idio-enum.js");
const IdioScalar = require("../src/idio-scalar.js");
const IdioDirective = require("../src/idio-directive.js");

describe("combineNodes", () => {
    it("should throw nodes required", async () => {
        try {
            await combineNodes();
        } catch (error) {
            expect(error.message).to.contain("combineNodes: nodes required");
        }
    });

    it("should throw node should be of type array", async () => {
        try {
            await combineNodes(99);
        } catch (error) {
            expect(error.message).to.contain(
                "combineNodes: expected nodes to be of type array recived 'number'"
            );
        }
    });

    it("should throw node should be a instance of GraphQLNode", async () => {
        try {
            await combineNodes([
                {
                    name: "User",
                    typeDefs: `
                        type User {
                            name: String
                            age: Int
                        }
                        
                        type Query {
                            getUserByID(id: ID!): User
                        }
                    `,
                    resolvers: {
                        Query: {},
                        Mutation: {},
                        Subscription: {},
                        Fields: {}
                    }
                }
            ]);
        } catch (error) {
            expect(error.message).to.contain(
                "combineNodes: recived a node not a instance of GraphQLNode"
            );
        }
    });

    it("should combine 1 node and return typeDefs and resolvers", async () => {
        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                }
                
                type Mutation {
                    updateUser(id: ID!): User
                }
            `,
            resolvers: {
                Mutation: { updateUser: () => true }
            }
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode]);

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Mutation")
            .to.have.property("updateUser")
            .to.be.a("function");
    });

    it("should combine 1 node (with a enum) and return typeDefs and resolvers", async () => {
        const StatusEnum = new IdioEnum({
            name: "Status",
            typeDefs: `
            enum Status {
                ONLINE
                OFFLINE
            }
            `,
            resolver: {
                ONLINE: "online",
                OFFLINE: "offline"
            }
        });

        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true },
                Mutation: {},
                Subscription: {},
                Fields: {}
            },
            enums: [StatusEnum]
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode]);

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("enum Status");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Status")
            .to.be.a("Object");
    });

    it("should throw node has Query in the typeDefs thats not defined in resolvers", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                        users: [User]
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true },
                    Mutation: {},
                    Subscription: {},
                    Fields: {}
                }
            });

            await combineNodes([UserNode]);
        } catch (error) {
            expect(error.message).to.contain(
                "node with name: 'User' has a Query in the typeDefs called 'users' thats not defined in resolvers"
            );
        }
    });

    it("should throw node has a Query resolver thats not defined in typeDefs", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true, users: () => true },
                    Mutation: {},
                    Subscription: {},
                    Fields: {}
                }
            });

            await combineNodes([UserNode]);
        } catch (error) {
            expect(error.message).to.contain(
                "node with name: 'User' has a Query resolver called 'users' thats not defined in typeDefs"
            );
        }
    });

    it("should throw node has Mutation in the typeDefs thats not defined in resolvers", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Mutation {
                        updateUser(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: {},
                    Mutation: {},
                    Subscription: {},
                    Fields: {}
                }
            });

            await combineNodes([UserNode]);
        } catch (error) {
            expect(error.message).to.contain(
                "node with name: 'User' has a Mutation in the typeDefs called 'updateUser' thats not defined in resolvers"
            );
        }
    });

    it("should throw node has a Mutation resolver thats not defined in typeDefs", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Mutation {
                        updateUser(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: {},
                    Mutation: {
                        createUser: () => true,
                        updateUser: () => true
                    },
                    Subscription: {},
                    Fields: {}
                }
            });

            await combineNodes([UserNode]);
        } catch (error) {
            expect(error.message).to.contain(
                "node with name: 'User' has a Mutation resolver called 'createUser' thats not defined in typeDefs"
            );
        }
    });

    it("should throw node has Subscription in the typeDefs thats not defined in resolvers", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Subscription {
                        userCreation: User
                    }
                `,
                resolvers: {
                    Query: {},
                    Mutation: {},
                    Subscription: {},
                    Fields: {}
                }
            });

            await combineNodes([UserNode]);
        } catch (error) {
            expect(error.message).to.contain(
                "node with name: 'User' has a Subscription in the typeDefs called 'userCreation' thats not defined in resolvers"
            );
        }
    });

    it("should throw node has a Subscription resolver thats not defined in typeDefs", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Subscription {
                        userCreation: User
                    }
                `,
                resolvers: {
                    Query: {},
                    Mutation: {},
                    Subscription: {
                        userCreation: () => true,
                        userUpdate: () => true
                    },
                    Fields: {}
                }
            });

            await combineNodes([UserNode]);
        } catch (error) {
            expect(error.message).to.contain(
                "node with name: 'User' has a Subscription resolver called 'userUpdate' thats not defined in typeDefs"
            );
        }
    });

    it("should combine 1 node (with a node) and return typeDefs and resolvers", async () => {
        const NestedNode = new GraphQLNode({
            name: "Nested",
            typeDefs: `
            type Nested {
                title: String
            }
            
            type Query {
                getNested: Nested
            }`,
            resolvers: {
                Query: {
                    getNested: () => true
                }
            }
        });

        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true },
                Mutation: {},
                Subscription: {},
                Fields: {}
            },
            nodes: [NestedNode]
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode]);

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type Nested");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getNested")
            .to.be.a("function");
    });

    it("should throw expected enums to be an array", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true }
                }
            });

            await combineNodes([UserNode], { enums: {} });
        } catch (error) {
            expect(error.message).to.contain("expected enums to be an array");
        }
    });

    it("should throw expected enum to be of type IdioEnum", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true }
                }
            });

            await combineNodes([UserNode], {
                enums: [
                    {
                        name: "Status",
                        resolver: {
                            ONLINE: "online",
                            OFFLINE: "offline"
                        },
                        typeDefs: `
                        enum Status {
                            ONLINE
                            OFFLINE
                        }
                        `
                    }
                ]
            });
        } catch (error) {
            expect(error.message).to.contain(
                `expected enum to be of type IdioEnum, recived:`
            );
        }
    });

    it("should combine 1 node & a global enum and return typeDefs and resolvers", async () => {
        const StatusEnum = new IdioEnum({
            name: "Status",
            resolver: {
                ONLINE: "online",
                OFFLINE: "offline"
            },
            typeDefs: `
            enum Status {
                ONLINE
                OFFLINE
            }
            `
        });

        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                    status: Status
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true }
            }
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode], {
            enums: [StatusEnum]
        });

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("enum Status");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Status")
            .to.be.a("object");
    });

    it("should throw expected scalars to be an array", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true }
                }
            });

            await combineNodes([UserNode], { scalars: {} });
        } catch (error) {
            expect(error.message).to.contain("expected scalars to be an array");
        }
    });

    it("should throw expected scalar to be of type IdioScalar", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true }
                }
            });

            await combineNodes([UserNode], {
                scalars: [{ name: "JSON", resolver: () => true }]
            });
        } catch (error) {
            expect(error.message).to.contain(
                `expected scalar to be of type IdioScalar, recived:`
            );
        }
    });

    it("should combine 1 node & a global scalar and return typeDefs and resolvers", async () => {
        const JSONScalar = new IdioScalar({
            name: "JSON",
            resolver: async () => true
        });

        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true }
            }
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode], {
            scalars: [JSONScalar]
        });

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("scalar JSON");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("JSON")
            .to.be.a("function");
    });

    it("should throw expected directives to be an array", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true }
                }
            });

            await combineNodes([UserNode], { directives: {} });
        } catch (error) {
            expect(error.message).to.contain(
                "expected directives to be an array"
            );
        }
    });

    it("should throw expected directive to be of type IdioDirective", async () => {
        try {
            const UserNode = new GraphQLNode({
                name: "User",
                typeDefs: `
                    type User {
                        name: String
                        age: Int
                    }
                    
                    type Query {
                        getUserByID(id: ID!): User
                    }
                `,
                resolvers: {
                    Query: { getUserByID: () => true }
                }
            });

            await combineNodes([UserNode], {
                directives: [
                    {
                        name: "hasPermission",
                        resolver: () => true,
                        typeDefs: `
                            input permissionInput {
                                resource: String!
                                action: String!
                            }
                            
                            directive @hasPermission(
                                permission: permissionInput!
                            ) on FIELD_DEFINITION 
                        `
                    }
                ]
            });
        } catch (error) {
            expect(error.message).to.contain(
                `expected directive to be of type IdioDirective, recived:`
            );
        }
    });

    it("should combine 1 node & a global directive and return typeDefs and resolvers & schemaDirectives", async () => {
        const hasPermissionDirective = new IdioDirective({
            name: "hasPermission",
            resolver: () => true,
            typeDefs: `
                input permissionInput {
                    resource: String!
                    action: String!
                }
                
                directive @hasPermission(
                    permission: permissionInput!
                ) on FIELD_DEFINITION 
            `
        });

        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true }
            }
        });

        const { typeDefs, resolvers, schemaDirectives } = await combineNodes(
            [UserNode],
            {
                directives: [hasPermissionDirective]
            }
        );

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("directive @hasPermission");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");

        expect(schemaDirectives)
            .to.be.an("object")
            .to.have.property("hasPermission")
            .to.be.a("function");
    });

    it("should apply an array of schemaGlobals and return resolvers and typeDefs", async () => {
        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                    address: Address
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true }
            }
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode], {
            schemaGlobals: [
                `
                    type Address {
                        line1: String
                        line2: String
                        postcode: String
                    }
                `
            ]
        });

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type Address");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");
    });

    it("should apply a single schemaGlobal and return resolvers and typeDefs", async () => {
        const UserNode = new GraphQLNode({
            name: "User",
            typeDefs: `
                type User {
                    name: String
                    age: Int
                    address: Address
                }
                
                type Query {
                    getUserByID(id: ID!): User
                }
            `,
            resolvers: {
                Query: { getUserByID: () => true }
            }
        });

        const { typeDefs, resolvers } = await combineNodes([UserNode], {
            schemaGlobals: `
            type Address {
                line1: String
                line2: String
                postcode: String
            }
        `
        });

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type User");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("type Address");

        expect(typeDefs)
            .to.be.a("string")
            .to.contain("schema");

        expect(resolvers)
            .to.be.an("object")
            .to.have.property("Query")
            .to.have.property("getUserByID")
            .to.be.a("function");
    });
});
