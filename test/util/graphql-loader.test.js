const { expect } = require("chai");
const path = require("path");
const graphQLLoader = require("../../src/util/graphql-loader.js");

describe("graphQLLoader", () => {
    it("should throw filePath required", async () => {
        try {
            await graphQLLoader();
        } catch (error) {
            expect(error.message).to.contain(
                "graphQLLoader: filePath required"
            );
        }
    });

    it("should load and return a graphql file as a string", async () => {
        const result = await graphQLLoader(
            path.join(__dirname, "../dummy-data/User.gql")
        );

        expect(result)
            .to.be.a("string")
            .to.contain(`type User`);
    });
});
