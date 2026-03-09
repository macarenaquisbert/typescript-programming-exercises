const nodePlugin = require("@learnpack/node/src/compile");
const { transpileExercise, withJsEntry } = require("./transpile");

module.exports = {
  validate: (...args) => nodePlugin.validate(...args),
  run: async function ({ exercise, socket, configuration }) {
    transpileExercise(exercise, configuration);
    return nodePlugin.run({
      exercise: withJsEntry(exercise),
      socket,
      configuration
    });
  }
};
