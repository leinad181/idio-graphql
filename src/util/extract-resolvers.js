/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
function extractResolvers({ definitions }, type) {
    return definitions
        .filter(({ kind, name: { value } }) => {
            if (
                kind === "ObjectTypeDefinition" ||
                kind === "ObjectTypeExtension"
            ) {
                return value === type;
            }
        })
        .flatMap(({ fields }) => fields)
        .map(({ name: { value } }) => value);
}

module.exports = extractResolvers;
